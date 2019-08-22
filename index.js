
const {birth}                 = require('./lib/create');

//const marker = /{%s\[\[(.+?)\]\]~~~}/g;
//
const sg      = require('sg-clihelp');
const {_}     = sg;
const split2  = require('split2');

const filename = sg.path.join(sg.os.homedir(), 'reformat-logcat1.log');

const letters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const numbers       = '0123456789';
const special       = '+*.';
var   categories    = [letters, numbers, special];
var   totalCount    = sg.reduce(categories, 0, (m, cat) => m + cat.length);
//console.log(`chk`, {letters, numbers, special, categories, totalCount});

var   generation  = 1;
var   id_         = 1;
const fields      = {total:0, score:0, miniScore:0};
var   genepool    = [...randomStart1000().map(genes => ({genes, anc: id_, id: id_++, generation, ...fields}))];


var   genRe   = genepool.map(g => birth(g));

_.each(genepool, g => {
  console.log(`run id: ${g.id} -- ${g.genes.join(', ')}`);
});


var lineNum = 0, numShown = 0, iCritter = 0, best = 0, miniBest = 0;

var iterations = 0;
var timer;
const main = function() {
  if (++iterations > 100) {
    clearTimeout(timer);
    return;
  }


  lineNum = 0, numShown = 0, iCritter = 0, best = 0, miniBest = 0;

  var marker, m;

  const instream = sg.fs.createReadStream(filename);
  instream.pipe(split2()).on('data', (line) => {
    lineNum += 1;

    for (iCritter = 0; iCritter < genRe.length; ++iCritter) {

      // No need to compute again
      if ('savedScore' in genRe[iCritter]) {
        continue;
      }

      var showIt = (Math.random() > 0.97);
      marker = genRe[iCritter].re;
      //console.log(`critter-crazy`, {iCritter, marker});

      if ((m = marker.exec(line))) {
        genRe[iCritter].score += 1;
        best = Math.max(best, genRe[iCritter].score);
        numShown += 1;
        showIt = true;
        console.log(`data ${lineNum}, id: ${genRe[iCritter].id}, (${iCritter})`, m[1], line);
      }

      // Mini-re
      marker = genRe[iCritter].miniRe;
      if ((m = marker.exec(line))) {
        genRe[iCritter].miniScore += 1;
        miniBest = Math.max(miniBest, genRe[iCritter].miniScore);
        //console.log(`----- mini-data ${lineNum}, id: ${genRe[iCritter].id}`, m[1], line);
      }
    }
  });


  instream.on('close', () => {
    var i;


    console.log(`close ${lineNum, numShown, generation, iterations}`);

    // Clean up mini-score
    for (i = 0; i < genRe.length; ++i) {
      if (!genRe[i].savedScore) {
        genRe[i].savedScore     = genRe[i].score;
        genRe[i].savedMiniScore = genRe[i].miniScore;
      } else {
        genRe[i].score          = genRe[i].savedScore;
        genRe[i].miniScore      = genRe[i].savedMiniScore;
      }

      if (genRe[i].miniGene.includes('*') || genRe[i].miniGene.includes('+') || genRe[i].miniGene.includes('.')) {
        // Cheater
        genRe[i].miniScore /= 10000;
      } else if (genRe[i].miniScore > 0) {
        genRe[i].miniScore /= 100;
      } else {
        genRe[i].miniScore = -(genRe[i].miniGene.length * 0.25);
      }
    }

    // Sort
    genRe = _.sortBy(genRe, 'score', 'miniScore');

    // Show
//    for (i = 100; i < genRe.length; ++i) {
//      if (genRe[i].miniScore > 0) {
//        console.log(`sorted(${i}) ${genRe[i].id}`, {score: genRe[i].score, miniScore: genRe[i].miniScore, gene: genRe[i].genes.join(','), miniGene: genRe[i].miniGene});
//      }
//    }
//    console.log(`======================================= just sorted above`);

    // Kill off 40%, allow best to try to reproduce
    genRe = genRe.slice(-genRe.length * 0.60);

//    for (i = 0; i < genRe.length; ++i) {
//      if (genRe[i].miniScore > 0) {
//        console.log(`score(${i}) ${genRe[i].id}`, {score: genRe[i].score, miniScore: genRe[i].miniScore, gene: genRe[i].genes.join(','), miniGene: genRe[i].miniGene});
//      }
//    }
//    console.log(`======================================= just cleansed above`);

    // This is the most-fit one
    i = genRe.length - 1;
    while (genRe.length < 1000) {
      if (Math.random() > 0.25) {
        //console.log(`outerrepo`, {parent: genRe[i]});

        let offspring = reproduce(genRe[i]);
        if (offspring) {
          genRe.push(offspring);
          if (genRe.length < 700) {
            console.log(`split(${genRe.length})(${i}) ${genRe[i].id} -> ${offspring.id}`, {score: genRe[i].score, miniScore: genRe[i].miniScore, gene: genRe[i].genes.join(','), xene: offspring.genes.join(','), miniGene: genRe[i].miniGene});
          }
        }
      }

      i -= 1;
      if (i <= -1) {
        i = genRe.length - 1;
      }
    }

    genRe = _.sortBy(genRe, 'score', 'miniScore');

    for (i = genRe.length - 100; i < genRe.length; ++i) {
//      if (genRe[i].miniScore > 0) {
        console.log(`score(${i},a ${genRe[i].anc}) ${genRe[i].id}`, {score: genRe[i].score, miniScore: genRe[i].miniScore, gene: genRe[i].miniGene});
//      }
    }

    generation += 1;

    return sg.setTimeout(0, main);
  });
};

showUpdates();
function showUpdates() {
  console.log(`line: ${lineNum}, critter: ${iCritter}, best: ${best} (${miniBest})`);

  timer = sg.setTimeout(1000, showUpdates);
};

main();

function randomStart1000() {
  var list = [];
  for (var i = 0; i < 1000; ++i) {
    list.push(randomStart());
  }
  return list;
}


function randomStart() {
  var genes = [];
  for (var i = 0; i < 7; ++i) {

    let len = Math.random() * 3;
    genes.push(oneItem(len));
  }

//  console.log(`genes`, {genes});
  return genes;
}

function oneItem(len) {
  var   result = '';

  for (var i = 0; i < len; ++i) {
    result += pickOne();
//    var x = Math.random() * totalCount;
//    if (x < letters.length) {
//      result += letters[Math.floor(x)];
//      continue;
//    }
//
//    x -= letters.length;
//    if (x < numbers.length) {
//      result += numbers[Math.floor(x)];
//      continue;
//    }
//
//    x -= numbers.length;
//    result += special[Math.floor(x)];
  }

  return result;
}

function pickOne() {
  var x = Math.random() * totalCount;
  if (x < letters.length) {
    return letters[Math.floor(x)];
  }

  x -= letters.length;
  if (x < numbers.length) {
    return numbers[Math.floor(x)];
  }

  x -= numbers.length;
  return special[Math.floor(x)];
}

function clone(x) {
  try {
    var dup = JSON.parse(JSON.stringify(x));
    delete dup.savedScore;
    dup = {...dup, id: id_++, generation: dup.generation+1, ...fields};
  } catch(err){

    console.error(err, `EPARSING`, {x});
    //throw err;
    return null;
  }

  return dup;
}

function reproduce(genRe) {
  var offspring = clone(genRe);
  if (!offspring)                       { return; }

  // Choose which `chromosome` to target
  var   x         = Math.floor(Math.random() * genRe.genes.length);
  const dieRoll   = Math.random() * 100;

  // 1% Chance of doubling a chromosome
  if (dieRoll < 1.0) {
    let dup = offspring.genes[x];
    offspring.genes.splice(x, 0, dup);
    //console.log(`repro double chromo`, {genRe, offspring, x});

  // 3% chance to Remove chromosome, but not if they have too few
  } else if (dieRoll < 4.0) {
    if (offspring.genes.length <= 4) {
      if (Math.random() < 0.5)                { return offspring; }
    }
    offspring.genes.splice(x, 1);
    //console.log(`repro rm chromo`, {genRe, offspring, x});

  // 3% chance to add a single char
  } else if (dieRoll < 7.0) {
    let y = Math.floor(Math.random() * (offspring.genes[x].length + 1));
    let s = offspring.genes[x];
    let c = pickOne();
    offspring.genes[x] = s.slice(0, y) + c + s.slice(y, s.length);
    //console.log(`repro add one char`, {genRe, offspring, x, y, c});

  // 3% chance to remove a single char
  } else if (dieRoll < 10.0) {
    let s = offspring.genes[x];

    // If we are removing the last char, we are really removing the whole chromosome
    if (s.length === 1) {
      offspring.genes.splice(x, 1);
    } else {
      let y = Math.floor(Math.random() * offspring.genes[x].length);
      offspring.genes[x] = s.slice(0, y) + s.slice(y+1, s.length);
      //console.log(`repro remove char`, {genRe, offspring, x, y});
    }

  // Otherwise, exchange a letter/digit
  } else {
    let y = Math.floor(offspring.genes[x].length * Math.random())
    let s = offspring.genes[x];
    let c = pickOne();
    offspring.genes[x] = s.slice(0, y) + c + s.slice(y+1, s.length);
    //console.log(`repro exchange`, {genRe, offspring, x, y, c});
  }

  try {
    // Fixup the RegExps
    offspring.re          = new RegExp(offspring.genes.join(''));
    offspring.miniGene    = offspring.genes[0] + offspring.genes[1];
    offspring.miniRe      = new RegExp(offspring.miniGene);

  } catch(err) {
    return null;
  }

  return offspring;
}

