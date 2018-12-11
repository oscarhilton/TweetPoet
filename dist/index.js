"use strict";

var getRhymes = require("get-rhymes");
var Tokenizer = require("sentence-tokenizer");
var syllable = require("syllable");

var _require = require("./tweets"),
    tweets = _require.tweets;

// Set up user's line


var sentence = "Tell me it's not true";
var splitSentence = sentence.split(" ");
var wordToBeRhymed = splitSentence[splitSentence.length - 1];

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
    case "is":
      return tweet.replace("is", "I'm");
    default:
      return tweet;
  }
});

var rhymeTweets = cleanTweets.map(function (tweet) {
  var splitTweet = tweet.split(" ");
  return {
    tweet: tweet,
    lastWord: splitTweet[splitTweet.length - 1].replace(/[^a-zA-Z]+/g, "")
  };
});

getRhymes(wordToBeRhymed).then(function (rhymes) {
  if (rhymeTweets.length < 1) {
    return console.warn("No rhymeTweets found");
  }
  var found = rhymeTweets.filter(function (tweet) {
    return rhymes.indexOf(tweet.lastWord) > -1 && tweet.lastWord !== wordToBeRhymed && !wordToBeRhymed.includes(tweet.lastWord) && !tweet.lastWord.includes(wordToBeRhymed) && getSyllableRange(getSentenceSyllables(sentence), getSentenceSyllables(tweet.tweet));
  });
  if (found.length < 1) return console.log("No foundtweets found");
  return outputNextLine(found);
}).catch(function (e) {
  return console.warn(e);
});

// Make sentence titlecase
function toTitleCase(str) {
  return str.replace(str[0], str[0].toUpperCase());
}

var outputNextLine = function outputNextLine(foundArray) {
  var randomLine = foundArray[Math.floor(Math.random() * foundArray.length)];
  // console.log(foundArray, randomLine);

  console.log(toTitleCase(sentence));
  console.log(toTitleCase(randomLine.tweet));
};