// Small local bridge to the handwriting engine installed with Windows.
// Input and output are JSON on stdin/stdout; no files or network are used.
using System;
using System.Collections;
using System.Collections.Generic;
using System.Drawing;
using System.Text;
using System.Text.RegularExpressions;
using System.Web.Script.Serialization;
using Microsoft.Ink;

public static class HandwritingRecognizer
{
    const double UnitsPerPixel = 2540.0 / 96.0;

    static object Read(Dictionary<string, object> request, RecognizerContext context)
    {
        using (var ink = new Ink())
        {
            context.Strokes = null;
            context.Factoid = Factoid.Default;
            // Spatial word gaps have already been determined by the caller.
            context.RecognitionFlags = RecognitionModes.WordMode;
            object mode;
            if (request.TryGetValue("mode", out mode) && (string)mode == "symbol")
            {
                // Do not let the word dictionary expand algebraic variables
                // or a short sequence of digits into English words.
                context.Factoid = Factoid.None;
                context.RecognitionFlags = RecognitionModes.WordMode;
            }
            var identities = new Dictionary<int, string>();
            foreach (Dictionary<string, object> source in (IEnumerable)request["strokes"])
            {
                var points = new List<Point>();
                foreach (IEnumerable pair in (IEnumerable)source["points"])
                {
                    var coordinates = new List<double>();
                    foreach (object coordinate in pair) coordinates.Add(Convert.ToDouble(coordinate));
                    points.Add(new Point((int)Math.Round(coordinates[0] * UnitsPerPixel), (int)Math.Round(coordinates[1] * UnitsPerPixel)));
                }
                if (points.Count == 1) points.Add(points[0]);
                var stroke = ink.CreateStroke(points.ToArray());
                identities[stroke.Id] = (string)source["id"];
            }
            context.Strokes = ink.Strokes;
            RecognitionStatus status;
            var result = context.Recognize(out status);
            var words = new List<object>();
            if (result != null && !String.IsNullOrWhiteSpace(result.TopString))
            {
                var ranges = new HashSet<string>();
                foreach (Match match in Regex.Matches(result.TopString, @"\S+"))
                {
                    int start = match.Index, length = match.Length;
                    var strokes = result.TopAlternate.GetStrokesFromTextRange(ref start, ref length);
                    if (!ranges.Add(start + ":" + length)) continue;
                    var ids = new List<string>();
                    foreach (Stroke stroke in strokes) if (identities.ContainsKey(stroke.Id)) ids.Add(identities[stroke.Id]);
                    if (ids.Count == 0) continue;
                    var alternatives = new List<string>();
                    foreach (RecognitionAlternate alternate in result.GetAlternatesFromSelection(start, length, 5)) alternatives.Add(alternate.ToString());
                    var rect = strokes.GetBoundingBox();
                    words.Add(new {
                        text = result.TopString.Substring(start, length).Trim(),
                        alternatives = alternatives, strokeIds = ids,
                        confidence = result.TopConfidence.ToString(),
                        box = new { x = rect.X / UnitsPerPixel, y = rect.Y / UnitsPerPixel, w = rect.Width / UnitsPerPixel, h = rect.Height / UnitsPerPixel }
                    });
                }
            }
            context.Strokes = null;
            return new { words = words, engine = context.Recognizer.Name };
        }
    }

    [STAThread]
    public static int Main(string[] args)
    {
        Console.InputEncoding = new UTF8Encoding(false);
        Console.OutputEncoding = new UTF8Encoding(false);
        var json = new JavaScriptSerializer { MaxJsonLength = 2000000 };
        try
        {
            using (var context = new RecognizerContext())
            {
                if (args.Length > 0 && args[0] == "--status")
                {
                    Console.WriteLine(json.Serialize(new { available = true, engine = context.Recognizer.Name, language = "en" }));
                    return 0;
                }
                var request = json.Deserialize<Dictionary<string, object>>(Console.In.ReadToEnd());
                if (request.ContainsKey("groups"))
                {
                    var results = new List<object>();
                    foreach (Dictionary<string, object> group in (IEnumerable)request["groups"])
                    {
                        results.Add(new { id = group["id"], result = Read(group, context) });
                    }
                    Console.WriteLine(json.Serialize(new { groups = results, engine = context.Recognizer.Name }));
                }
                else Console.WriteLine(json.Serialize(Read(request, context)));
            }
            return 0;
        }
        catch (Exception error)
        {
            Console.Error.WriteLine("Windows handwriting recognition failed: " + error.ToString());
            return 1;
        }
    }
}
