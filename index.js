const getRhymes = require("get-rhymes");
const Tokenizer = require("sentence-tokenizer");
const syllable = require("syllable");
const { tweets } = require("./tweets");
const axios = require("axios");
const readlineSync = require("readline-sync");
const chalk = require("chalk");

// Set up user's line
const myArgs = process.argv.slice(2);
const sentence = myArgs.join(" ");

let thePoem = [];

const getSentenceSyllables = sentenceToUse => {
  const split = sentenceToUse.split(" ");
  return split.reduce((total, word) => syllable(word) + total, 0);
};

const getSyllableRange = (syb1, syb2) => {
  const allowed = 2;
  if (syb1 - syb2 >= -allowed && syb1 - syb2 <= allowed) {
    return true;
  }
  if (syb2 - syb1 >= -allowed && syb2 - syb1 <= allowed) {
    return true;
  }
  return false;
};

// Split large tweets into smaller sentences
var tokenizer = new Tokenizer("Chuck");
tweets.map(tweet => {
  tokenizer.setEntry(tweet);
  tweets.concat(tokenizer.getSentences());
});

// Remove twitter hanldes
let cleanTweets = tweets.map(tweet => {
  return tweet.replace(/@\w+/g, "").trim();
});

// Replace awkward first words
cleanTweets = cleanTweets.map(tweet => {
  switch (tweet.split(" ")[0].toLowerCase()) {
    case "has":
      return tweet.replace("has", "I have");
    case "isnt":
      return tweet.replace("isnt", "I'm not");
    default:
      return tweet;
  }
});

// Put tweets into rhyme object
const rhymeTweets = cleanTweets.map(tweet => {
  const splitTweet = tweet.split(" ");
  return {
    tweet,
    lastWord: splitTweet[splitTweet.length - 1].replace(/[^a-zA-Z]+/g, ""),
  };
});

// Call the rhyme API
const getThingsThatRhymeWith = async function(word) {
  try {
    const res = await axios.get(
      `https://api.datamuse.com/words?rel_rhy=${word}&max=1000`
    );
    return res.data.map(word => word.word);
  } catch (e) {
    console.log(e);
  }
};

const LargeConsole = log => {
  console.log(chalk.green("********************************"));
  console.log("                           ");
  console.log("                           ");
  log.map(line => console.log(chalk.yellow(line)));
  console.log("                           ");
  console.log("                           ");
  console.log(chalk.green("********************************"));
};

// Make sentence titlecase
function toTitleCase(str) {
  return str.replace(str[0], str[0].toUpperCase());
}

// Make a new line of the poem
const startPoemLine = () => {
  var sentence = readlineSync.question("*** Input a line to the poem: *** ");

  const splitSentence = sentence.split(" ");
  const wordToBeRhymed = splitSentence[splitSentence.length - 1];

  getThingsThatRhymeWith(wordToBeRhymed)
    .then(rhymes => {
      if (rhymeTweets.length < 1) {
        return console.warn("No rhymeTweets found");
      }

      const found = rhymeTweets.filter(
        tweet =>
          rhymes.indexOf(tweet.lastWord) !== -1 &&
          tweet.lastWord !== wordToBeRhymed &&
          !wordToBeRhymed.includes(tweet.lastWord) &&
          !tweet.lastWord.includes(wordToBeRhymed) &&
          getSyllableRange(
            getSentenceSyllables(sentence),
            getSentenceSyllables(tweet.tweet)
          )
      );
      if (found.length < 1) {
        console.log(chalk.red("Oh no, no good rhyme for that line :-("));
        return startPoemLine();
      }
      const randomLine = found[Math.floor(Math.random() * found.length)];
      return addToPoem(toTitleCase(sentence), toTitleCase(randomLine.tweet));
    })
    .catch(e => console.warn(e));
};

// Add the line to the poem
const addToPoem = (line1, line2) => {
  thePoem.push(line1);
  thePoem.push(line2);

  LargeConsole(thePoem);

  if (readlineSync.keyInYN("Do you want to finish the poem?")) {
    console.log("Poem finished!");
    thePoem = [];
    if (readlineSync.keyInYN("Want to write another poem?")) {
      startPoemLine();
    } else {
      console.log("Bye bye!");
    }
  } else {
    startPoemLine();
  }
};

startPoemLine();
