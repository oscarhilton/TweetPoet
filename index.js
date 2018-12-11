const getRhymes = require("get-rhymes");
var Tokenizer = require("sentence-tokenizer");
var syllable = require("syllable");
var { tweets } = require("./tweets");

// Set up user's line
const sentence = "Tell me it's not true";
const splitSentence = sentence.split(" ");
const wordToBeRhymed = splitSentence[splitSentence.length - 1];

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
    case "is":
      return tweet.replace("is", "I'm");
    default:
      return tweet;
  }
});

const rhymeTweets = cleanTweets.map(tweet => {
  const splitTweet = tweet.split(" ");
  return {
    tweet,
    lastWord: splitTweet[splitTweet.length - 1].replace(/[^a-zA-Z]+/g, ""),
  };
});

getRhymes(wordToBeRhymed)
  .then(rhymes => {
    if (rhymeTweets.length < 1) {
      return console.warn("No rhymeTweets found");
    }
    const found = rhymeTweets.filter(
      tweet =>
        rhymes.indexOf(tweet.lastWord) > -1 &&
        tweet.lastWord !== wordToBeRhymed &&
        !wordToBeRhymed.includes(tweet.lastWord) &&
        !tweet.lastWord.includes(wordToBeRhymed) &&
        getSyllableRange(
          getSentenceSyllables(sentence),
          getSentenceSyllables(tweet.tweet)
        )
    );
    if (found.length < 1) return console.log("No foundtweets found");
    return outputNextLine(found);
  })
  .catch(e => console.warn(e));

// Make sentence titlecase
function toTitleCase(str) {
  return str.replace(str[0], str[0].toUpperCase());
}

const outputNextLine = foundArray => {
  const randomLine = foundArray[Math.floor(Math.random() * foundArray.length)];
  // console.log(foundArray, randomLine);

  console.log(toTitleCase(sentence));
  console.log(toTitleCase(randomLine.tweet));
};
