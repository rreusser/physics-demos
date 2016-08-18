kill(all);

E0: E00 * exp(%i * (k0 * x - w * t)) + E01 * exp(%i * (-k0 * x - w * t));
E1: E10 * exp(%i * (k1 * x - w * t)) + E11 * exp(%i * (-k1 * x - w * t));
E2: E20 * exp(%i * (k2 * x - w * t));

E0x: diff(E0, x);
E1x: diff(E1, x);
E2x: diff(E2, x);

cond1: expand((subst(x1, x, E0) - subst(x1, x, E1)) * exp(%i * w * t));
cond2: expand((subst(x2, x, E1) - subst(x2, x, E2)) * exp(%i * w * t));
cond3: expand((subst(x1, x, E0x) - subst(x1, x, E1x)) * exp(%i * w * t));
cond4: expand((subst(x2, x, E1x) - subst(x2, x, E2x)) * exp(%i * w * t));

A: matrix(
  [coeff(cond1, E01), coeff(cond1, E10), coeff(cond1, E11), coeff(cond1, E20)],
  [coeff(cond2, E01), coeff(cond2, E10), coeff(cond2, E11), coeff(cond2, E20)],
  [coeff(cond3, E01), coeff(cond3, E10), coeff(cond3, E11), coeff(cond3, E20)],
  [coeff(cond4, E01), coeff(cond4, E10), coeff(cond4, E11), coeff(cond4, E20)]
);

b: matrix([
  -coeff(cond1, E00) * E00,
  -coeff(cond2, E00) * E00,
  -coeff(cond3, E00) * E00,
  -coeff(cond4, E00) * E00
]);
