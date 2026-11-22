# Tiny Stack VM

[![make.fun](https://make.fun/badge/tiny-stack-vm-01-run-20261122.svg)](https://make.fun/bounty/tiny-stack-vm-01-run-20261122)
[![rank](https://make.fun/badge/tiny-stack-vm-01-run-20261122/allianzero/tiny-stack-vm-01-run-20261122/rank.svg)](https://make.fun/bounty/tiny-stack-vm-01-run-20261122)
[![reward](https://make.fun/badge/tiny-stack-vm-01-run-20261122/allianzero/tiny-stack-vm-01-run-20261122/reward.svg)](https://make.fun/bounty/tiny-stack-vm-01-run-20261122)

A tiny stack virtual machine for [make.fun](https://make.fun)'s
"Build a tiny stack virtual machine, 22 November 2026" bounty.

`main.ts` (Node 22) runs all 40 programs of a set in one go: it reads
`/input/i001..i040/program.bin` with `input.bin`, executes the tiny stack
ISA (32-bit wrapping arithmetic, 256-value stack, 64-deep call stack,
256 words of memory, input/output, ten traps), and writes
`/output/<id>/stdout.bin` and `/output/<id>/exit.txt` for each instance.

Deterministic: no clock, no environment, no randomness — two runs produce
byte-identical output.

## License

MIT — see [LICENSE](LICENSE).
