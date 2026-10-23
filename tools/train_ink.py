"""Train/export a reproducible CNN + bidirectional GRU CTC handwriting baseline.

Run from the project root: Scripts/python.exe tools/train_ink.py --epochs 24
Data: UCI UJI Pen Characters v2 (CC BY 4.0); see training_data/uji/ATTRIBUTION.md.
"""
import argparse
import hashlib
import json
import math
import random
import sys
import time
from collections import defaultdict
from pathlib import Path

import numpy as np
import torch
from torch import nn
from torch.nn.utils.rnn import pad_sequence, pack_padded_sequence, pad_packed_sequence

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from educations.ink_preprocessing import rasterize


class InkCTC(nn.Module):
    def __init__(self, classes):
        super().__init__()
        self.conv = nn.Sequential(
            nn.Conv2d(1, 32, 3, padding=1), nn.BatchNorm2d(32), nn.ReLU(), nn.MaxPool2d(2),
            nn.Conv2d(32, 64, 3, padding=1), nn.BatchNorm2d(64), nn.ReLU(), nn.MaxPool2d(2),
            nn.Conv2d(64, 96, 3, padding=1), nn.BatchNorm2d(96), nn.ReLU(), nn.MaxPool2d((2, 1)),
        )
        self.project = nn.Linear(96 * 4, 128)
        self.rnn = nn.GRU(128, 96, num_layers=2, batch_first=True, bidirectional=True, dropout=.1)
        self.output = nn.Linear(192, classes)

    def forward(self, images: torch.Tensor, lengths: torch.Tensor):
        features = self.conv(images).permute(0, 3, 1, 2).flatten(2)
        features = torch.relu(self.project(features))
        packed = pack_padded_sequence(features, lengths.cpu(), batch_first=True, enforce_sorted=False)
        encoded, _ = self.rnn(packed)
        encoded, _ = pad_packed_sequence(encoded, batch_first=True)
        return self.output(encoded)


class ExportInk(nn.Module):
    def __init__(self, model):
        super().__init__()
        self.model = model

    def forward(self, images: torch.Tensor):
        lengths = torch.full((images.size(0),), images.size(3)//4, dtype=torch.long, device=images.device)
        return self.model(images, lengths)


def read_uji(path):
    samples, sample = [], None
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line.startswith("WORD "):
            _, label, session = line.split()
            sample = dict(text=label, writer=session.rsplit("-", 1)[0], strokes=[])
            if len(label) == 1 and label.isascii():
                samples.append(sample)
        elif line.startswith("POINTS ") and sample is not None:
            values = list(map(float, line.split("#")[1].split()))
            scale = 152. if "_UPV_" in sample["writer"] else 100.
            sample["strokes"].append([(values[i]/scale, values[i+1]/scale) for i in range(0, len(values), 2)])
    return [s for s in samples if s["strokes"]]


WORDS = "math maths learn school number science hello world write equation class teacher student fun pen board text sentence answer solve add subtract divide multiply one two three four five six seven eight nine ten algebra fraction root power test notebook education energy water light".split()


class Generator:
    def __init__(self, samples, vocabulary):
        self.samples = samples
        self.by_char = defaultdict(list)
        for sample in samples:
            self.by_char[sample["text"]].append(sample)
        self.chars = sorted(self.by_char)
        self.index = {char: index for index, char in enumerate(vocabulary)}

    def make(self, rng, max_chars=6, augment=True, single=None):
        if single is not None:
            chosen = [single]
        elif rng.random() < .35 or max_chars == 1:
            chosen = [rng.choice(self.samples)]
        else:
            if rng.random() < .6:
                text = rng.choice(WORDS)
                if rng.random() < .4: text = text.upper()
                text = text[:max_chars]
            else:
                pool = self.chars if rng.random() < .35 else list("0123456789")
                text = "".join(rng.choices(pool, k=rng.randint(2, max_chars)))
            chosen = [rng.choice(self.by_char[c]) for c in text]
        strokes, x = [], 0.
        for sample in chosen:
            points = [p for stroke in sample["strokes"] for p in stroke]
            left, right = min(p[0] for p in points), max(p[0] for p in points)
            sx, sy = (rng.uniform(.85, 1.15), rng.uniform(.9, 1.1)) if augment else (1., 1.)
            shear = rng.uniform(-.12, .12) if augment else 0.
            offset = rng.uniform(-.35, .35) if augment else 0.
            for stroke in sample["strokes"]:
                strokes.append([((px-left)*sx+x+shear*(py-10), py*sy+offset) for px, py in stroke])
            x += max(.7, right-left)*sx + (rng.uniform(.8, 2.2) if augment else 1.3)
        image = rasterize(strokes, thickness=rng.uniform(1.1, 2.0) if augment else 1.5)
        tensor = torch.from_numpy(np.asarray(image).copy()).float().unsqueeze(0)/255.
        text = "".join(sample["text"] for sample in chosen)
        return tensor, torch.tensor([self.index[c] for c in text], dtype=torch.long), text


def batch(examples):
    widths = [image.shape[2] for image, _, _ in examples]
    images = torch.zeros(len(examples), 1, 32, max(widths))
    for i, (image, _, _) in enumerate(examples):
        images[i, :, :, :widths[i]] = image
    targets = torch.cat([target for _, target, _ in examples])
    return images, targets, torch.tensor([w//4 for w in widths]), torch.tensor([len(t) for _, t, _ in examples])


def decode(logits, lengths, vocabulary):
    predictions = []
    for sequence, length in zip(logits.argmax(-1).tolist(), lengths.tolist()):
        previous, chars = 0, []
        for index in sequence[:length]:
            if index and index != previous: chars.append(vocabulary[index])
            previous = index
        predictions.append("".join(chars))
    return predictions


def edit_distance(a, b):
    row = list(range(len(b)+1))
    for i, ca in enumerate(a, 1):
        new = [i]
        for j, cb in enumerate(b, 1):
            new.append(min(new[-1]+1, row[j]+1, row[j-1]+(ca != cb)))
        row = new
    return row[-1]


def evaluate(model, examples, vocabulary, batch_size=48):
    model.eval()
    correct, total, edits, chars = 0, 0, 0, 0
    details = []
    with torch.inference_mode():
        for start in range(0, len(examples), batch_size):
            part = examples[start:start+batch_size]
            images, _, lengths, _ = batch(part)
            predicted = decode(model(images, lengths), lengths, vocabulary)
            for guess, (_, _, text) in zip(predicted, part):
                total += 1; correct += guess == text; edits += edit_distance(guess, text); chars += len(text)
                if len(details) < 30: details.append(dict(expected=text, predicted=guess))
    return dict(samples=total, exact_accuracy=correct/total, character_error_rate=edits/chars, examples=details)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--epochs", type=int, default=24)
    parser.add_argument("--samples-per-epoch", type=int, default=6000)
    parser.add_argument("--batch-size", type=int, default=40)
    parser.add_argument("--resume", action="store_true")
    args = parser.parse_args()
    torch.set_num_threads(3)
    torch.manual_seed(20261021); random.seed(20261021); np.random.seed(20261021)
    output = ROOT / "models/whiteboard"
    output.mkdir(parents=True, exist_ok=True)
    source = ROOT / "training_data/uji/ujipenchars2.txt"
    samples = read_uji(source)
    vocabulary = [""] + sorted({s["text"] for s in samples})
    writers = sorted({s["writer"] for s in samples if s["writer"].startswith("trn_")})
    validation_writers = set(writers[-5:])
    train = [s for s in samples if s["writer"].startswith("trn_") and s["writer"] not in validation_writers]
    validation = [s for s in samples if s["writer"] in validation_writers]
    test = [s for s in samples if s["writer"].startswith("tst_")]
    print(json.dumps(dict(train=len(train), validation=len(validation), test=len(test), classes=len(vocabulary), torch=torch.__version__)), flush=True)
    train_gen, val_gen = Generator(train, vocabulary), Generator(validation, vocabulary)
    val_rng = random.Random(917)
    val_examples = [val_gen.make(val_rng, augment=False, single=s) for s in validation]
    val_words = [val_gen.make(val_rng, augment=False) for _ in range(350)]
    model = InkCTC(len(vocabulary))
    best, first_epoch = math.inf, 1
    optimizer = torch.optim.AdamW(model.parameters(), lr=.0015, weight_decay=.0001)
    if args.resume:
        saved = torch.load(output/"training.pt", weights_only=True)
        model.load_state_dict(saved["model"]); optimizer.load_state_dict(saved["optimizer"])
        first_epoch = saved["epoch"]+1; best = saved["best"]
    criterion = nn.CTCLoss(blank=0, zero_infinity=True)
    for epoch in range(first_epoch, args.epochs+1):
        started, loss_sum = time.time(), 0.
        model.train()
        rng = random.Random(20261021+epoch)
        # Similar widths share a batch, avoiding convolution over mostly empty
        # padding when a narrow letter and a long word occur together.
        epoch_examples = [train_gen.make(rng, max_chars=1 if epoch <= 3 else (3 if epoch <= 6 else 7)) for _ in range(args.samples_per_epoch)]
        epoch_examples.sort(key=lambda sample: sample[0].shape[2])
        batches = [epoch_examples[start:start+args.batch_size] for start in range(0, len(epoch_examples), args.batch_size)]
        rng.shuffle(batches)
        for examples in batches:
            images, targets, lengths, target_lengths = batch(examples)
            logits = model(images, lengths)
            loss = criterion(logits.log_softmax(-1).transpose(0, 1), targets, lengths, target_lengths)
            optimizer.zero_grad(); loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(), 5)
            optimizer.step(); loss_sum += loss.item()
        metrics = evaluate(model, val_examples, vocabulary)
        word_metrics = evaluate(model, val_words, vocabulary)
        score = (metrics["character_error_rate"]+word_metrics["character_error_rate"])/2
        print(json.dumps(dict(epoch=epoch, seconds=round(time.time()-started, 1), loss=round(loss_sum/(args.samples_per_epoch/args.batch_size), 4), validation_accuracy=round(metrics["exact_accuracy"], 4), validation_word_accuracy=round(word_metrics["exact_accuracy"], 4), validation_cer=round(score, 4))), flush=True)
        with (output/"training.jsonl").open("a", encoding="utf-8") as log:
            log.write(json.dumps(dict(epoch=epoch, seconds=round(time.time()-started, 1), validation_accuracy=metrics["exact_accuracy"], validation_word_accuracy=word_metrics["exact_accuracy"], validation_cer=score))+"\n")
        if score < best:
            best = score
            torch.save(model.state_dict(), output/"best_weights.pt")
        torch.save(dict(model=model.state_dict(), optimizer=optimizer.state_dict(), epoch=epoch, best=best), output/"training.pt")
        if epoch >= 12:
            for group in optimizer.param_groups: group["lr"] = .0007 if epoch < 20 else .0003
    model.load_state_dict(torch.load(output/"best_weights.pt", weights_only=True))
    model.eval()
    test_gen, test_rng = Generator(test, vocabulary), random.Random(2001)
    test_examples = [test_gen.make(test_rng, augment=False, single=s) for s in test]
    test_words = [test_gen.make(test_rng, augment=False) for _ in range(1000)]
    report = dict(seed=20261021, epochs=args.epochs, source_sha256=hashlib.sha256(source.read_bytes()).hexdigest(), train_writers=sorted(set(s["writer"] for s in train)), validation_writers=sorted(validation_writers), test_writers=sorted(set(s["writer"] for s in test)), training_samples=len(train), validation_samples=len(validation), test_samples=len(test), isolated_test=evaluate(model, test_examples, vocabulary), composed_word_test=evaluate(model, test_words, vocabulary), limitations=["Isolated UJI characters and composed words; no natural cursive word training", "ASCII letters, digits and dataset punctuation only; math layout is separate", "Case and similar-looking characters can be ambiguous"])
    metadata = dict(format="raster_ctc_v1", height=32, max_width=512, vocabulary_sha256=hashlib.sha256(json.dumps(vocabulary, ensure_ascii=False).encode()).hexdigest(), engine="PyTorch UJI CNN-GRU CTC", review_required=True)
    scripted = torch.jit.script(ExportInk(model))
    torch.jit.save(scripted, str(output/"ink.pt"), _extra_files={"metadata.json": json.dumps(metadata)})
    (output/"vocabulary.json").write_text(json.dumps(vocabulary, ensure_ascii=False), encoding="utf-8")
    (output/"evaluation.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    (output/"metadata.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    print(json.dumps(report), flush=True)


if __name__ == "__main__":
    main()
