"use strict";

var getRhymes = require("get-rhymes");
var Tokenizer = require("sentence-tokenizer");
var syllable = require("syllable");

var _require = require("./tweets"),
    tweets = _require.tweets;

var axios = require("axios");
var readlineSync = require("readline-sync");
var chalk = require("chalk");

// Set up user's line
var myArgs = process.argv.slice(2);
var sentence = myArgs.join(" ");

var thePoem = [];

var getSentenceSyllables = function getSentenceSyllables(sentenceToUse) {
  var split = sentenceToUse.split(" ");
  return split.reduce(function (total, word) {
    return syllable(word) + total;
  }, 0);
};

var getSyllableRange = function getSyllableRange(syb1, syb2) {
  var allowed = 2;
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
tweets.map(function (tweet) {
  tokenizer.setEntry(tweet);
  tweets.concat(tokenizer.getSentences());
});

// Remove twitter hanldes
var cleanTweets = tweets.map(function (tweet) {
  return tweet.replace(/@\w+/g, "").trim();
});

// Replace awkward first words
cleanTweets = cleanTweets.map(function (tweet) {
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
var rhymeTweets = cleanTweets.map(function (tweet) {
  var splitTweet = tweet.split(" ");
  return {
    tweet: tweet,
    lastWord: splitTweet[splitTweet.length - 1].replace(/[^a-zA-Z]+/g, "")
  };
});

// Call the rhyme API
var getThingsThatRhymeWith = async function getThingsThatRhymeWith(word) {
  try {
    var res = await axios.get("https://api.datamuse.com/words?rel_rhy=" + word + "&max=1000");
    return res.data.map(function (word) {
      return word.word;
    });
  } catch (e) {
    console.log(e);
  }
};

var LargeConsole = function LargeConsole(log) {
  console.log(chalk.green("********************************"));
  console.log("                           ");
  console.log("                           ");
  log.map(function (line) {
    return console.log(chalk.yellow(line));
  });
  console.log("                           ");
  console.log("                           ");
  console.log(chalk.green("********************************"));
};

// Make sentence titlecase
function toTitleCase(str) {
  return str.replace(str[0], str[0].toUpperCase());
}

// Make a new line of the poem
var startPoemLine = function startPoemLine() {
  var sentence = readlineSync.question("*** Input a line to the poem: *** ");

  var splitSentence = sentence.split(" ");
  var wordToBeRhymed = splitSentence[splitSentence.length - 1];

  getThingsThatRhymeWith(wordToBeRhymed).then(function (rhymes) {
    if (rhymeTweets.length < 1) {
      return console.warn("No rhymeTweets found");
    }

    var found = rhymeTweets.filter(function (tweet) {
      return rhymes.indexOf(tweet.lastWord) !== -1 && tweet.lastWord !== wordToBeRhymed && !wordToBeRhymed.includes(tweet.lastWord) && !tweet.lastWord.includes(wordToBeRhymed) && getSyllableRange(getSentenceSyllables(sentence), getSentenceSyllables(tweet.tweet));
    });
    if (found.length < 1) {
      console.log(chalk.red("Oh no, no good rhyme for that line :-("));
      return startPoemLine();
    }
    var randomLine = found[Math.floor(Math.random() * found.length)];
    return addToPoem(toTitleCase(sentence), toTitleCase(randomLine.tweet));
  }).catch(function (e) {
    return console.warn(e);
  });
};

// Add the line to the poem
var addToPoem = function addToPoem(line1, line2) {
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