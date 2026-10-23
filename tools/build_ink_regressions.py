"""Create labeled synthetic stroke fixtures, never real-writer accuracy data."""
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]

GLYPHS={
    '2': [[(0,10),(8,0),(24,0),(32,10),(29,20),(0,50),(32,50)]],
    'x': [[(0,0),(30,50)],[(30,0),(0,50)]],
    '+': [[(0,25),(30,25)],[(15,10),(15,40)]],
    '5': [[(32,0),(0,0),(0,24),(20,22),(32,32),(30,44),(20,50),(0,47)]],
    '=': [[(0,18),(32,18)],[(0,32),(32,32)]],
    '7': [[(0,0),(32,0),(10,50)]],
    '1': [[(0,10),(10,0),(10,50)]],
}


def main():
    directory=ROOT/'educations/fixtures/handwriting'
    directory.mkdir(parents=True,exist_ok=True)
    for name,lines in [('trailing-seven',['2x+5=7']),('two-equation-lines',['2x+5=7','x=1'])]:
        strokes=[];expected=[]
        for index,text in enumerate(lines):
            ids=[]
            for column,char in enumerate(text):
                for points in GLYPHS[char]:
                    identity=f'line-{index}-stroke-{len(strokes)}'; ids.append(identity)
                    strokes.append(dict(id=identity,points=[[x+column*48,y+index*110] for x,y in points]))
            expected.append(dict(text=text,format='math',strokeIds=ids))
        sample=dict(schemaVersion=1,datasetKind='synthetic',labelSource='hand-constructed glyph templates',
                    writer='synthetic-templates',session='regression-v1',verified=True,
                    mode='math',strokes=strokes,expected=expected)
        (directory/(name+'.json')).write_text(json.dumps(sample,indent=2)+'\n',encoding='utf-8')
    print('Synthetic regression fixtures:',directory)


if __name__=='__main__': main()
