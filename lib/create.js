
//var   genRe   = genepool.map(g => new RegExp(g.join('')));

exports.birth = function(critter) {

  try {
    critter.re          = new RegExp(critter.genes.join(''));
    critter.miniGene    = critter.genes[0] + critter.genes[1];
    critter.miniRe      = new RegExp(critter.miniGene);
    return critter;

  } catch(err) {}

  critter.genes       = ['abc', 'def', '1234'];
  critter.re          = new RegExp(critter.genes.join(''));
  critter.miniGene    = critter.genes[0] + critter.genes[1];
  critter.miniRe      = new RegExp(critter.miniGene);

  return critter;
};

