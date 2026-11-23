// Wajid — Circuit design

pragma circom 2.0.0;

include "circomlib/circuits/comparators.circom";
include "circomlib/circuits/bitify.circom";

template AgeVerify() {
    signal input birthYear;
    signal input currentYear;
    signal input minAge;
    signal age;

    var birthYearFloor = 1900;

    // A 64-bit decomposition both requires birthYear to be within [0, 2^64)
    // and prevents a negative field value from being used as a birth year.
    component birthRange = Num2Bits(64);
    birthRange.in <== birthYear;

    // Reject birth years before 1900.
    component floorCheck = LessThan(64);
    floorCheck.in[0] <== birthYear;
    floorCheck.in[1] <== birthYearFloor;
    floorCheck.out === 0;

    age <== currentYear - birthYear;

    // Reject birth years later than the supplied current year.
    component birthNotInFuture = LessThan(64);
    birthNotInFuture.in[0] <== currentYear;
    birthNotInFuture.in[1] <== birthYear;
    birthNotInFuture.out === 0;

    // LessThan(out) is 1 only when age < minAge, so an output of 0 proves
    // that the computed age satisfies age >= minAge.
    component ageCheck = LessThan(64);
    ageCheck.in[0] <== age;
    ageCheck.in[1] <== minAge;
    ageCheck.out === 0;
}

component main {public [currentYear, minAge]} = AgeVerify();
