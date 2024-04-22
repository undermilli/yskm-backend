// 실험중
const User = require("../models/user.model");
const UserDb = require("../models/userdb.model");
const httpStatus = require("http-status");
const { TIER_LIST } = require("../constants/tierList");
const { statusCodes } = require("../constants/codes");
const { messages } = require("../constants/messages");
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
  let response;
  if (isAnswerCorrect) {
    tierIndex += 4;
  } else {
    if (tierIndex > 0) {
      tierIndex -= 4;
    }
  }
  if (uid === undefined) {
    response = {
      tier: TIER_LIST[tierIndex],
      questionsAnsweredNb: questionsAnsweredNb + 1,
      score: 0,
    };
  } else {
    response = await User.findOneAndUpdate(
      { _id: uid },
      {
        $set: {
          tier: TIER_LIST[tierIndex],
          questionsAnsweredNb: questionsAnsweredNb + 1,
        },
      },
      { returnOriginal: false },
    );
  }
  const infosToReturn = { user: response, lps: 100 };
  return infosToReturn;
};

const calculateCorrectAnswerPoints = (tier) => {
  if (["M", "GM", "C"].includes(tier)) {
    return 8;
  } else return 80;
};

const calculateWrongAnswerPoints = (tier) => {
  if (["M", "GM", "C"].includes(tier)) {
    return -5;
  } else return -50;
};

const handleClassicQuestions = async (
  uid,
  currentScore,
  currentTier,
  isAnswerCorrect,
  questionsAnsweredNb,
) => {
  const lps = isAnswerCorrect
    ? calculateCorrectAnswerPoints(currentTier)
    : calculateWrongAnswerPoints(currentTier);
  const updatedScore = currentScore + lps;
  const tierIndex = TIER_LIST.indexOf(currentTier);
  let newScore = updatedScore;
  let newTier = currentTier;
  let response;
  // demote after 2 wrong answers in a row
  if (updatedScore < -50) {
    newScore = 100 + updatedScore; // score is negative so we add it to 100 (ex : 100 + (-50) = 50)
    // to avoid ranking issues when few users and user should be demoted to D1 when ranked M and above
    if (tierIndex > TIER_LIST.length - 3) {
      newTier = "D1";
    } else {
      newTier = TIER_LIST[tierIndex - 1];
    }
  }
  // update score and tier if user has enough points and is not master or above
  else if (updatedScore >= 100 && tierIndex < TIER_LIST.length - 3) {
    newScore = updatedScore - 100;
    newTier = TIER_LIST[tierIndex + 1];
    if (newTier === "M") {
      newScore = 0;
    }
  }
  if (uid === undefined) {
    response = {
      tier: newTier,
      questionsAnsweredNb: questionsAnsweredNb + 1,
      score: newScore,
    };
  } else {
    response = await User.findOneAndUpdate(
      { _id: uid },
      {
        $set: {
          score: newScore,
          tier: newTier,
          questionsAnsweredNb: questionsAnsweredNb + 1,
        },
      },
      { returnOriginal: false },
    );
  }
  if (["M", "GM", "C"].includes(newTier) && newScore > 0) {
    response = await updateTopTiers(response);
  }
  const infosToReturn = { user: response, lps: Math.abs(lps) };
  return infosToReturn;
};

const updateTopTiers = async (currentUser) => {
  const topUsers = await User.find({ tier: { $in: ["M", "GM", "C"] } }).sort({
    score: "desc",
  });
  let updatedUser = currentUser;
  for (let i = 0; i < topUsers.length; i++) {
    let updatedTier = topUsers[i].tier;
    let userHasToUpdate = false;
    if (i < 3) {
      if (topUsers[i].tier !== "C") {
        updatedTier = "C";
        userHasToUpdate = true;
      }
    } else if (i < 30) {
      if (topUsers[i].tier !== "GM") {
        updatedTier = "GM";
        userHasToUpdate = true;
      }
    } else {
      if (topUsers[i].tier !== "M") {
        updatedTier = "M";
        userHasToUpdate = true;
      }
    }
    if (userHasToUpdate) {
      const response = await User.findOneAndUpdate(
        { _id: topUsers[i]._id },
        { $set: { tier: updatedTier } },
        { returnOriginal: false },
      );
      if (response.username === currentUser.username) {
        updatedUser = response;
      }
    }
  }
  return updatedUser;
};

exports.updateTierAndScore = async (req, res) => {
  try {
    const user = req.user ? req.user : req.body.user;
    const tier = user.tier;
    const score = user.score;
    const questionsAnsweredNb = user.questionsAnsweredNb;
    const isAnswerCorrect = req.body.isAnswerCorrect;
    const uid = user._id;
    let response;
    if (questionsAnsweredNb < 5) {
      response = await handlePlacementQuestions(
        uid,
        tier,
        isAnswerCorrect,
        questionsAnsweredNb,
      );
    } else {
      response = await handleClassicQuestions(
        uid,
        score,
        tier,
        isAnswerCorrect,
        questionsAnsweredNb,
      );
    }
    return res.status(httpStatus.OK).json(response);
  } catch (error) {
    console.log(error);
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
    const currentTier = req.query.tier;
    const filter = mapTierToFilter(currentTier);
    const questions = await UserDb.find(filter);
    if (questions.length === 0) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ error: "No questions found for this tier" });
    }
    let multipleChoices = [];
    let tries = 0;
    let selectedQuestion;
    // tries to avoid infinite loops
    while (multipleChoices.length < 4 && tries < 5) {
      selectedQuestion =
        questions[Math.floor(Math.random() * questions.length)];

      multipleChoices = await getOtherMultipleChoiceAnswers(
        selectedQuestion,
        currentTier,
      );
      tries += 1;
    }
    if (multipleChoices.length < 4) {
      throw new AppError(
        statusCodes.ERROR,
        messages.NOT_FOUND,
        statusCodes.ERROR,
      );
    }

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
    console.log(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: error });
  }
};

async function getOtherMultipleChoiceAnswers(selectedQuestion, currentTier) {
  let filter;

  if (["I4", "I3", "I2", "I1"].includes(currentTier)) {
    return ["FAKER", "FAKER", "FAKER", "FAKER"];
  } else if (["B4", "B3", "B2", "B1"].includes(currentTier)) {
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
      YEAR: selectedQuestion.YEAR,
      IGN: { $ne: selectedQuestion.IGN },
      LEAGUE: "LCK",
    };
  } else if (["G4", "G3", "G2", "G1"].includes(currentTier)) {
    filter = {
      YEAR: selectedQuestion.YEAR,
      IGN: { $ne: selectedQuestion.IGN },
      LEAGUE: { $in: ["LCK", "LPL", "LEC", "LCS"] },
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

exports.getUserRanking = async (req, res) => {
  try {
    // get user from db with user ID then if user found check if he is in the page, if not, include him
    const users = await User.find();
    const currentUsername = req.query.username;
    const user = users.find((user) => user.username === currentUsername);
    const sortedUsers = users.sort((a, b) => {
      if (a.tier === b.tier) {
        return b.score - a.score;
      }
      return TIER_LIST.indexOf(b.tier) - TIER_LIST.indexOf(a.tier);
    });
    const pageSize = Math.ceil(sortedUsers.length / 10);
    const currentPage = req.params.page;
    const start = (currentPage - 1) * 10;
    const slicedUsers = sortedUsers.slice(start, start + 10);
    if (!slicedUsers.includes(user) && currentUsername !== "") {
      slicedUsers.pop();
      slicedUsers.push(user);
    }
    const formatedUsers = [];
    slicedUsers.forEach((user) => {
      formatedUsers.push({
        rank: users.indexOf(user) + 1,
        username: user.username,
        score: user.score,
        tier: user.tier,
      });
    });
    const data = {
      users: formatedUsers,
      pageSize: pageSize,
      currentPage: currentPage,
    };
    return res.status(httpStatus.OK).json(data);
  } catch (error) {
    console.log(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: error });
  }
};
