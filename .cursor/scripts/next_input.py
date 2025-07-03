# .cursor/next_input.py
#!/usr/bin/env python3
import sys
try:
    cmd = input("next> ").strip()
except EOFError:
    cmd = "stop"
if not cmd:
    cmd = "stop"
print(cmd)
