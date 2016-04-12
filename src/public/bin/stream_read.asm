r0 = where
return EOF location
READ_LINE:   push r1
READ_LINE_2: in r1
             equal r1, #10
             branch $READ_LINE_3
             equal r1, #0
             branch $READ_LINE_3
             mov @r0, r1
             inc r0
             jump $READ_LINE_2
READ_LINE_3: pop r1
             jump back