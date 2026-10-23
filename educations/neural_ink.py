"""Local TorchScript CTC inference with a checked vocabulary and input contract."""
import hashlib
import json
from functools import lru_cache


def _text_body(strokes):
    """Keep an isolated baseline dot that CTC can otherwise omit at word end.

    Only a single tiny mark strictly to the right of the letter body qualifies.
    Dots above letters, colons, exclamation marks and math decimal points are
    left for recognition/layout rather than being reinterpreted as periods.
    """
    from .ink_layout import box
    whole = box(strokes)
    limit = max(1.5, whole["h"]*.08)
    tiny = [s for s in strokes if max(box([s])["w"], box([s])["h"]) <= limit]
    body = [s for s in strokes if s not in tiny]
    if not body:
        return strokes, ""
    b = box(body)
    trailing = [s for s in tiny if box([s])["x"] >= b["x"]+b["w"]+max(2, b["h"]*.08)]
    if len(trailing) != 1:
        return strokes, ""
    mark = box(trailing)
    if b["h"] >= 10 and b["y"]+b["h"]*.75 <= mark["y"] <= b["y"]+b["h"]*1.15:
        return [s for s in strokes if s is not trailing[0]], "."
    return strokes, ""


@lru_cache(maxsize=2)
def load_model(checkpoint, vocabulary):
    import torch
    with open(vocabulary, encoding="utf-8") as source:
        tokens = json.load(source)
    if not isinstance(tokens, list) or not 2 <= len(tokens) <= 512 or tokens[0] != "" or not all(isinstance(t, str) and len(t) <= 40 for t in tokens) or len(set(tokens)) != len(tokens):
        raise ValueError("Expected a JSON array of CTC tokens")
    extra = {"metadata.json": ""}
    model = torch.jit.load(str(checkpoint), map_location="cpu", _extra_files=extra).eval()
    metadata = json.loads(extra["metadata.json"] or "{}")
    if not isinstance(metadata, dict) or metadata.get("format") != "raster_ctc_v1":
        raise ValueError("Unsupported handwriting checkpoint input format")
    digest = hashlib.sha256(json.dumps(tokens, ensure_ascii=False).encode()).hexdigest()
    if digest != metadata.get("vocabulary_sha256"):
        raise ValueError("Vocabulary does not match the checkpoint")
    torch.set_num_threads(2)
    with torch.inference_mode():
        probe = model(torch.zeros(1, 1, 32, 32))
    if probe.ndim != 3 or probe.shape[0] != 1 or probe.shape[2] != len(tokens) or not 1 <= probe.shape[1] <= 4096 or not torch.isfinite(probe).all():
        raise ValueError("Checkpoint output does not match its vocabulary")
    return model, tokens, metadata


def recognize_groups(groups, checkpoint, vocabulary):
    import torch
    from .ink_preprocessing import rasterize
    from .ink_layout import box
    model, vocabulary, metadata = load_model(checkpoint, vocabulary)
    output = []
    for group in groups:
        strokes = group["strokes"]
        body, punctuation = _text_body(strokes) if group.get("mode") == "text" else (strokes, "")
        image = rasterize([stroke["points"] for stroke in body])
        pixels = torch.frombuffer(bytearray(image.tobytes()), dtype=torch.uint8).float()
        features = pixels.reshape(1, 1, image.height, image.width)/255.
        with torch.inference_mode():
            logits = model(features)
        if logits.ndim != 3 or logits.shape[0] != 1 or logits.shape[2] != len(vocabulary) or not 1 <= logits.shape[1] <= 4096 or not torch.isfinite(logits).all():
            raise ValueError("Invalid model output; expected [1, time, vocabulary] logits")
        probabilities, indices = logits.softmax(-1).max(-1)
        previous, tokens, confidence = None, [], []
        for index, probability in zip(indices[0].tolist(), probabilities[0].tolist()):
            if index != 0 and index != previous:
                tokens.append(vocabulary[index]); confidence.append(probability)
            previous = index
        text = "".join(tokens).strip()
        if text and punctuation and not text.endswith(punctuation):
            text += punctuation; tokens.append(punctuation)
        words = [dict(text=text, tokens=tokens, strokeIds=[s["id"] for s in strokes], box=box(strokes), alternatives=[], confidence="Strong" if not metadata.get("review_required", True) and confidence and min(confidence) >= .85 else "Intermediate", score=round(min(confidence), 4) if confidence else 0.)] if text else []
        output.append(dict(id=group["id"], result=dict(words=words)))
    return dict(groups=output)
