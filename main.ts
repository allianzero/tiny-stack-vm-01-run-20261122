// Tiny stack VM for make.fun's tiny-stack-vm-01 (ISA v1).
// Runs every instance of a set in one go: reads /input/i001..i040,
// writes /output/<id>/stdout.bin and /output/<id>/exit.txt.
// Values are 32-bit wrapping ints; data stack 256, call stack 64,
// memory 256 words, 1,000,000 steps, 65,536 output bytes.
// Traps (exit codes): 2 underflow, 3 overflow, 4 div-by-zero,
// 5 bad opcode, 6 bad memory address, 7 call depth, 8 empty RET,
// 9 pc out of program, 10 step limit, 11 output limit.
import {mkdirSync,readFileSync,writeFileSync} from "node:fs";

// [immediate bytes, pops, pushes] per opcode byte.
const T={0:[0,0,0],1:[1,0,1],2:[4,0,1],3:[0,1,0],4:[0,1,2],5:[0,2,2],6:[0,2,3],7:[0,3,3],
16:[0,2,1],17:[0,2,1],18:[0,2,1],19:[0,2,1],20:[0,2,1],21:[0,2,1],22:[0,2,1],23:[0,1,1],
24:[0,2,1],25:[0,2,1],26:[0,2,1],27:[0,1,1],28:[0,2,1],29:[0,2,1],30:[0,2,1],31:[0,2,1],
32:[0,2,1],33:[0,2,1],34:[0,2,1],48:[2,0,0],49:[2,1,0],50:[2,1,0],51:[2,0,0],52:[0,0,0],
64:[0,1,1],65:[0,2,0],80:[0,1,0],81:[0,1,0],82:[0,0,1],83:[0,1,0]};

function run(p,q){
  const D=new Int32Array(256),C=new Int32Array(64),M=new Int32Array(256),o=new Uint8Array(65536);
  let sp=0,cp=0,ip=0,pc=0,st=0,ol=0;
  const end=e=>[Buffer.from(o.subarray(0,ol)),e];
  for(;;){
    if(st===1e6)return end(10);
    if(pc<0||pc>=p.length)return end(9);
    const b=p[pc],t=T[b];
    if(!t)return end(5);
    const im=t[0];
    if(pc+im>=p.length)return end(9);
    st++;
    const nx=pc+1+im;
    if(sp<t[1])return end(2);
    if(sp-t[1]+t[2]>256)return end(3);
    pc=nx;
    switch(b){
      case 0:return end(0);
      case 1:D[sp++]=(p[nx-1]<<24)>>24;break;
      case 2:D[sp++]=p[nx-4]|p[nx-3]<<8|p[nx-2]<<16|p[nx-1]<<24;break;
      case 3:sp--;break;
      case 4:D[sp]=D[sp-1];sp++;break;
      case 5:{const x=D[sp-1];D[sp-1]=D[sp-2];D[sp-2]=x;break;}
      case 6:D[sp]=D[sp-2];sp++;break;
      case 7:{const a=D[sp-3];D[sp-3]=D[sp-2];D[sp-2]=D[sp-1];D[sp-1]=a;break;}
      case 23:D[sp-1]=-D[sp-1]|0;break;
      case 27:D[sp-1]=~D[sp-1];break;
      case 16:case 17:case 18:case 19:case 20:case 21:case 22:case 24:case 25:
      case 26:case 28:case 29:case 30:case 32:case 33:case 34:{
        const y=D[sp-1],x=D[sp-2];let r=0;
        if(b===16)r=x+y|0;
        else if(b===17)r=x-y|0;
        else if(b===18)r=Math.imul(x,y);
        else if(b===19){if(!y)return end(4);r=x===-2147483648&&y===-1?x:(x/y)|0;}
        else if(b===20){if(!y)return end(4);r=y===-1?0:x%y|0;}
        else if(b===21){if(!y)return end(4);r=Math.floor((x>>>0)/(y>>>0))|0;}
        else if(b===22){if(!y)return end(4);r=(x>>>0)%(y>>>0)|0;}
        else if(b===24)r=x&y;
        else if(b===25)r=x|y;
        else if(b===26)r=x^y;
        else if(b===28)r=x<<(y&31);
        else if(b===29)r=x>>(y&31);
        else if(b===30)r=(x>>>(y&31))|0;
        else if(b===32)r=x===y?1:0;
        else if(b===33)r=x<y?1:0;
        else r=(x>>>0)<(y>>>0)?1:0;
        sp-=2;D[sp++]=r;break;
      }
      case 48:case 49:case 50:{
        const rel=((p[nx-2]|p[nx-1]<<8)<<16)>>16;
        if(b===48){pc=nx+rel;break;}
        const v=D[--sp];
        if((b===49&&v===0)||(b===50&&v!==0))pc=nx+rel;
        break;
      }
      case 51:
        if(cp===64)return end(7);
        C[cp++]=nx;pc=p[nx-2]|p[nx-1]<<8;break;
      case 52:
        if(!cp)return end(8);
        pc=C[--cp];break;
      case 64:{
        const a=D[sp-1];
        if(a<0||a>255)return end(6);
        D[sp-1]=M[a];break;
      }
      case 65:{
        const a=D[sp-1],v=D[sp-2];
        if(a<0||a>255)return end(6);
        sp-=2;M[a]=v;break;
      }
      case 80:{
        const s=String(D[sp-1]);
        if(ol+s.length>65536)return end(11);
        sp--;
        for(let i=0;i<s.length;i++)o[ol++]=s.charCodeAt(i);
        break;
      }
      case 81:
        if(ol+1>65536)return end(11);
        o[ol++]=D[--sp]&255;break;
      case 82:D[sp++]=ip<q.length?q[ip++]:-1;break;
      case 83:return end(D[--sp]&255);
    }
  }
}

// The mounts' stand-ins in local runs (the grader sets them; on the
// server they are real mounts at /input and /output).
const IN=process.env.MAKEFUN_INPUT_DIR??"/input";
const OUT=process.env.MAKEFUN_OUTPUT_DIR??"/output";

for(let k=1;k<=40;k++){
  const id="i"+String(k).padStart(3,"0");
  const p=readFileSync(IN+"/"+id+"/program.bin");
  const q=readFileSync(IN+"/"+id+"/input.bin");
  const r=run(p,q);
  mkdirSync(OUT+"/"+id,{recursive:true});
  writeFileSync(OUT+"/"+id+"/stdout.bin",r[0]);
  writeFileSync(OUT+"/"+id+"/exit.txt",String(r[1]));
}
