// 실험중
const User = require("../models/user.model");
const UserDb = require("../models/userdb.model");
const httpStatus = require("http-status");
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
// To demote to a lower tier, the user must give wrong answer when having a score below 0 (two wrong answers in a row)
// ex : S4 demote to B1 if score = -10 and user gives wrong answer
// then put score to 100 - (-actual score) and tier to B1

const handlePlacementQuestions = async (
  uid,
  currentTier,
  isAnswerCorrect,
  questionsAnsweredNb,
) => {
  // get the index of the current tier in the tier list and increment or decrement it
  let tierIndex = TIER_LIST.indexOf(currentTier);
  if (isAnswerCorrect) {
    tierIndex += 4;
  } else {
    if (tierIndex > 0) {
      tierIndex -= 4;
    }
  }
  const response = await User.findOneAndUpdate(
    { _id: uid },
    {
      $set: {
        tier: TIER_LIST[tierIndex],
        questionsAnsweredNb: questionsAnsweredNb + 1,
      },
    },
  );
  return response;
};

const handleClassicQuestions = async (
  uid,
  currentScore,
  currentTier,
  isAnswerCorrect,
  questionsAnsweredNb,
) => {
  const updatedScore = isAnswerCorrect ? currentScore + 80 : currentScore - 50;
  const tierIndex = TIER_LIST.indexOf(currentTier);
  let newScore = currentScore;
  let newTier = currentTier;
  // demote after 2 wrong answers in a row
  if (updatedScore < -50) {
    newScore = 100 + updatedScore; // score is negative so we add it to 100 (ex : 100 + (-50) = 50)
    newTier = TIER_LIST[tierIndex - 1];
  } else if (updatedScore >= 100) {
    newScore = updatedScore - 100;
    newTier = TIER_LIST[tierIndex + 1];
  } else {
    newScore = updatedScore;
  }
  const response = await User.findOneAndUpdate(
    { _id: uid },
    {
      $set: {
        score: newScore,
        tier: newTier,
        questionsAnsweredNb: questionsAnsweredNb + 1,
      },
    },
  );
  return response;
};

exports.updateTierAndScore = async (req, res) => {
  try {
    const datas = req.user;
    const tier = datas.tier;
    const score = datas.score;
    const questionsAnsweredNb = datas.questionsAnsweredNb;
    const isAnswerCorrect = req.body.isAnswerCorrect;
    const uid = req.user._id;
    if (questionsAnsweredNb < 5) {
      const response = await handlePlacementQuestions(
        uid,
        tier,
        isAnswerCorrect,
        questionsAnsweredNb,
      );
      return res.status(httpStatus.OK).json(response);
    } else {
      const response = await handleClassicQuestions(
        uid,
        score,
        tier,
        isAnswerCorrect,
        questionsAnsweredNb,
      );
      return res.status(httpStatus.OK).json(response);
    }
  } catch (error) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: error });
  }
};

const mapTierToFilter = (tier) => {
  if (["I4", "I3", "I2", "I1"].includes(tier)) {
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
    const userID = req.user._id;
    userInfo = await User.findOne({ _id: userID });
    const currentTier = userInfo.tier;
    const filter = mapTierToFilter(currentTier);
    const questions = await UserDb.find(filter);
    if (questions.length === 0) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ error: "No questions found for this tier" });
    }

    const selectedQuestion =
      questions[Math.floor(Math.random() * questions.length)];

    const multipleChoices = await getOtherMultipleChoiceAnswers(
      selectedQuestion,
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
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: error });
  }
};

async function getOtherMultipleChoiceAnswers(selectedQuestion, currentTier) {
  let filter;

  if (["I4", "I3", "I2", "I1"].includes(currentTier)) {
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
  const potentialAnswers = await UserDb.distinct("IGN", filter);
  // Shuffle the array and pick the first 3 IGNs
  const shuffled = potentialAnswers.sort(() => 0.5 - Math.random());
  const selectedIGNs = shuffled.slice(0, 3);

  return [selectedQuestion.IGN, ...selectedIGNs];
}
