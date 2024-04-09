// 실험중
const User = require("../models/user.model");
const AuthService = require("../services/auth.service");

const { MongoClient } = require("mongodb");
const uri = process.env.MONGODB_URL;
const client = new MongoClient(uri);

// Filters to get the player to find depending on the tier
const IRON_TIER_FILTER = { IGN: "FAKER" };
const BRONZE_TIER_FILTER = {
  IGN: { $ne: "FAKER" },
  TEAM: "T1",
  YEAR: 23,
};
const SILVER_TIER_FILTER = {
  $or: [
    { TEAM: "Gen.G", YEAR: 23 },
    { IGN: { $in: ["SHOWMAKER", "DEFT", "KIIN", "CANYON", "BDD"] } },
  ],
};
const GOLD_TO_MASTER_TIER_FILTER = {
  YEAR: { $in: [20, 21, 22, 23] },
  LEAGUE: { $in: ["LCK", "LPL", "LEC", "LCS"] },
};
const GRANDMASTER_FILTER = {
  YEAR: { $in: [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23] },
  LEAGUE: { $in: ["LCK", "LPL", "LEC", "LCS"] },
};

const TIER_LIST = [
  "I4",
  "I3",
  "I2",
  "I1",
  "B4",
  "B3",
  "B2",
  "B1",
  "S4",
  "S3",
  "S2",
  "S1",
  "G4",
  "G3",
  "G2",
  "G1",
  "P4",
  "P3",
  "P2",
  "P1",
  "E4",
  "E3",
  "E2",
  "E1",
  "D4",
  "D3",
  "D2",
  "D1",
  "M",
  "GM",
  "C",
];

// use a local points system
// each subtier is 100 points
// To demote to a lower tier, the user must give wrong answer when having a score below 0
// ex : S4 demote to B1 if score = -10 and user gives wrong answer
// then put score to 100 - (-actual score) and tier to B1

const handlePlacementQuestions = async (
  currentTier,
  isAnswerCorrect,
  questionsAnsweredNb,
) => {
  // todo : add or remove 400 hundred points and move to bext or prev tier qnd return new score and tier
  let tierIndex = TIER_LIST.indexOf(currentTier);
  if (isAnswerCorrect) {
    tierIndex += 1;
  } else {
    if (tierIndex > 0) {
      tierIndex -= 1;
    }
  }
  const response = await User.findOneAndUpdate(
    { _id: req.user._id },
    {
      $set: {
        tier: TIER_LIST[tierIndex],
        questionsAnsweredNb: questionsAnsweredNb + 1,
      },
    },
  );
  return response;
};

const handleClassicQuestions = (currentScore, currentTier, isAnswerCorrect) => {
  // todo : add or remove 100 points and move to bext or prev tier if needed and return new score and tier
};

exports.updateTierAndScore = async (req, res) => {
  try {
    console.log("updateTierAndScore");
    await client.connect();
    const db = client.db("test");
    const coll = db.collection("users");
    const userID = req.user._id;
    const currentTier = req.user.tier;
    const currentScore = req.user.score;
    const questionsAnsweredNb = req.user.questionsAnsweredNb;
    const isAnswerCorrect = req.body.isAnswerCorrect;

    let updatedTier = currentTier;
    let updatedScore = currentScore;
    if (questionsAnsweredNb === 0) {
      const response = await handlePlacementQuestions(
        currentTier,
        isAnswerCorrect,
        questionsAnsweredNb,
      );
      console.log(response);
    } else {
      handleClassicQuestions(currentScore, currentTier, isAnswerCorrect);
    }
    // Update the user's document with the new tier and score
    await coll.updateOne(
      { _id: userID },
      { $set: { tier: updatedTier, score: updatedScore } },
    );

    res.json({ message: "Tier and score updated successfully" });
  } catch (error) {
    console.error("Error updating tier and score:", error);
    res.status(500).json({ error: "Failed to update tier and score" });
  } finally {
    await client.close();
  }
};

const mapTierToFilter = (tier) => {
  if ([" ", "I4", "I3", "I2", "I1"].includes(tier)) {
    return IRON_TIER_FILTER;
  } else if (["B4", "B3", "B2", "B1"].includes(tier)) {
    return BRONZE_TIER_FILTER;
  } else if (["S4", "S3", "S2", "S1"].includes(tier)) {
    return SILVER_TIER_FILTER;
  } else if (
    [
      "G4",
      "G3",
      "G2",
      "G1",
      "P4",
      "P3",
      "P2",
      "P1",
      "E4",
      "E3",
      "E2",
      "E1",
      "D4",
      "D3",
      "D2",
      "D1",
      "M",
    ].includes(tier)
  ) {
    return GOLD_TO_MASTER_TIER_FILTER;
  } else if (["GM"].includes(tier)) {
    return GRANDMASTER_FILTER;
  } else {
    return {};
  }
};

exports.sendQuestionToFrontend = async (req, res) => {
  try {
    await client.connect();
    const db = client.db("yskm");
    const coll = db.collection("userdb");
    const currentTier = req.user.tier;
    const filter = mapTierToFilter(currentTier);
    const questions = await coll.find(filter).toArray();
    if (questions.length === 0) {
      return res
        .status(404)
        .json({ error: "No questions found for this tier" });
    }

    const selectedQuestion =
      questions[Math.floor(Math.random() * questions.length)];

    const multipleChoices = await getOtherMultipleChoiceAnswers(
      selectedQuestion,
      coll,
      currentTier,
    );

    const shuffledMultipleChoices = multipleChoices.sort(
      () => 0.5 - Math.random(),
    );

    const questionDetails = {
      YEAR: selectedQuestion.YEAR,
      POS: selectedQuestion.POS,
      NAT: selectedQuestion.NAT,
      TEAM: selectedQuestion.TEAM,
      BIRTH: selectedQuestion.BIRTH,
      CHAMP1: selectedQuestion.CHAMP1,
      CHAMP2: selectedQuestion.CHAMP2,
      CHAMP3: selectedQuestion.CHAMP3,
      LEAGUE: selectedQuestion.LEAGUE,
    };

    const response = {
      question: questionDetails,
      multipleChoices: shuffledMultipleChoices,
      answer: selectedQuestion.IGN,
    };

    res.json(response);
  } catch (error) {
    console.error("Error sending question to frontend:", error);
    res.status(500).json({ error: "Failed to send question to frontend" });
  } finally {
    await client.close();
  }
};

async function getOtherMultipleChoiceAnswers(
  selectedQuestion,
  coll,
  currentTier,
) {
  let filter;

  if ([" ", "I4", "I3", "I2", "I1"].includes(currentTier)) {
    return ["FAKER", "FAKER", "FAKER", "FAKER"];
  } else if (["B4", "B3", "B2", "B1"]) {
    filter = {
      $or: [
        {
          YEAR: 23,
          IGN: { $ne: selectedQuestion.IGN },
          TEAM: { $in: ["T1", "Gen.G"] },
        },
        { IGN: { $in: ["Showmaker", "Deft", "Kiin", "Canyon", "BDD"] } },
      ],
    };
  } else if (["S4", "S3", "S2", "S1"].includes(currentTier)) {
    filter = {
      $or: [
        {
          YEAR: selectedQuestion.YEAR,
          IGN: { $ne: selectedQuestion.IGN },
          LEAGUE: "LCK",
        },
      ],
    };
  } else if (["G4", "G3", "G2", "G1"].includes(currentTier)) {
    filter = {
      $or: [
        {
          YEAR: selectedQuestion.YEAR,
          IGN: { $ne: selectedQuestion.IGN },
          LEAGUE: { $in: ["LCK", "LPL", "LEC", "LCS"] },
        },
      ],
    };
  } else if (
    [
      "P4",
      "P3",
      "P2",
      "P1",
      "E4",
      "E3",
      "E2",
      "E1",
      "D4",
      "D3",
      "D2",
      "D1",
    ].includes(currentTier)
  ) {
    filter = {
      YEAR: selectedQuestion.YEAR,
      LEAGUE: selectedQuestion.LEAGUE,
      IGN: { $ne: selectedQuestion.IGN },
    };
  } else if (["M", "GM", "C"].includes(currentTier)) {
    filter = {
      YEAR: selectedQuestion.YEAR,
      LEAGUE: selectedQuestion.LEAGUE,
      POS: selectedQuestion.POS,
      IGN: { $ne: selectedQuestion.IGN },
    };
  }
  const potentialAnswers = await coll.distinct("IGN", filter);
  // Shuffle the array and pick the first 3 IGNs
  const shuffled = potentialAnswers.sort(() => 0.5 - Math.random());
  const selectedIGNs = shuffled.slice(0, 3);

  return [selectedQuestion.IGN, ...selectedIGNs];
}
