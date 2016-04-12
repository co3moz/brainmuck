r0 = address of text
return r0 = EOF location
WRITE: equal @r0, #0
       branch back
       out @r0
       inc r0
jump $WRITE


r0 = number
WRITE_NUMBER: push r0
              push r1
              push r2
              push r3
              small r0, #0
              branch not $WRITE_NUM_0
              mov r3, $BR
              mul r0, #-1
WRITE_NUM_0:  mov r1, #0
WRITE_NUM_1:  mov r2, r0
              mod r2, #10
              push r2
              div r0, #10
              inc r1
              not equal r0, #0
              branch $WRITE_NUM_1
              equal r3, #0
              branch $WRITE_NUM_2
              out #45
WRITE_NUM_2:  equal r1, #0
              branch $WRITE_NUM_3
              pop r0
              add r0, #48
              out r0
              dec r1
              jump $WRITE_NUM_2
WRITE_NUM_3:  pop r3
              pop r2
              pop r1
              pop r0
              jump back