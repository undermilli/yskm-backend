// 실험중
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

exports.accessDB = async (req, res) => {
  try {
    await client.connect();

    const db = client.db("sample_data");
    // const coll = db.collection("sample_data");
    const coll = db.collection("final_real_data");

    // Get the user's current score from the request object
    const userScore = req.user.score;
    // 실험중//////// Define filtering criteria.
    // TODO: 유저의 티어에 따라 filter값 바뀌어야함.
    // TODO: 이 filter로 뽑아내는 문제들이 바뀔것임.
    let filter;
    if (userScore === 0) {
      filter = { YEAR: 23 };
    } else if (userScore === 1) {
      filter = { $and: [{ YEAR: { $in: [20, 22] } }, { LEAGUE: "LCS" }] };
    } else if (userScore === 2) {
      filter = { YEAR: { $in: [20, 22] } };
    } else {
      // filter = {};
      filter = { IGN: "FAKER" };
    }
    ///////////////////

    // Find documents matching the filter
    const cursor = coll.find(filter);

    // Collect the documents in an array
    const documents = await cursor.toArray();
    // Send the documents as a JSON response
    res.json(documents);

    // 실험중 /////// Update user's score
    const updatedScore = userScore + 1;
    req.user.score = updatedScore;
    const updatedUser = await AuthService.saveUser(req.user);
    //
  } finally {
    await client.close();
  }
};

// TODO: 이 부분을 아마 앱의 도입부로 해야할듯.
//       티어가 " "면 일단 tier = "I4", score = 0 으로 설정하고 문제 retrieve하고 배치고사...
//       첫번째 배치고사 이후 tier랑 score 설정 후 또 두번째 문제... 이런식으로?
exports.setTier = async (req, res) => {
  try {
    await client.connect();

    const db = client.db("test");
    const coll = db.collection("users");

    // Get the user's ID from the request object
    const userID = req.user._id;

    // Retrieve the user's document from the database
    const userDocument = await coll.findOne({ _id: userID });

    // Check if the "tier" field exists in the user's document
    if (userDocument.tier === " ") {
      // If the "tier" field doesn't exist, add it with the desired value
      // userDocument.tier = " ";
      userDocument.tier = "S4";

      // Update the user's document in the database with the new "tier" field
      await coll.updateOne(
        { _id: userID },
        { $set: { tier: userDocument.tier } },
      );

      // //// 실험중 ////
      // req.user.tier = userDocument.tier;
      // await AuthService.saveUser(req.user);

      // TODO: 여기서 티어배치고사 문제
    } else {
      // TODO: 여기서는 일반 문제

      // 밑에는 임시로 항상 S3로 설정
      userDocument.tier = "I1";
      await coll.updateOne(
        { _id: userID },
        { $set: { tier: userDocument.tier } },
      );

      // //// 실험중 ////
      // req.user.tier = userDocument.tier;
      // await AuthService.saveUser(req.user);
    }

    res.json({ message: "Tier set successfully" });
  } catch (error) {
    console.error("Error setting tier:", error);
    res.status(500).json({ error: "Failed to set tier" });
  } finally {
    await client.close();
  }
};

// TODO: 아마 한문제 맞힐때마다 score 업데이트 하고 이 function 부르게될듯
exports.updateTierAndScore = async (req, res) => {
  try {
    await client.connect();

    const db = client.db("test");
    const coll = db.collection("users");

    const userID = req.user._id;
    const currentTier = req.user.tier;
    const currentScore = req.user.score;

    // TODO: 여기 하기전에 다시 생각해볼것....
    //       퀴즈 문제 맞히고 틀렸을때 점수가 어떻게 되는지부터 차근차근히 생각해보고 접근할것.
    //       문제를 풀고나면 점수가 업데이트된 채로 이 함수로 오는건지? 아니면 이 함수에서 업데이트 해야하는건지?
    //       현재 이미 user 정보가 있는 상태여서 굳이 user db 확인 안하고 req.user로 정보 접근할 수 있는건지?

    //////////////
    // 일반 문제 //
    //////////////
    // 문제 맞히고 티어 변하면 변한 티어의 문제 난이도를 부여받음
    // (문제 맞히거나 틀려서 업데이트 될때마다 티어 확인 후 문제 출제범위 확인할것).

    // (1) 티어가 "M", "GM", "C"일 경우
    // * 맞히면 +8 pt, 틀리면 -5 pt.
    // * pt 시스템으로 통합.
    // * "GM"는 "M"이상 유저들 중 pt 상위 30명.
    //   "C"는 "GM"이상 유저들 중 pt 상위 3명.

    // (2) 티어가 "M" 미만일 경우
    // * 맞히면 +80 pt, 틀리면 -50 pt.
    // * 1 세부티어는 100 pt.
    // * 점수가 100점이 넘으면 다음 티어로 바뀌고 점수는 초과값만큼 추가됨.
    //   if (tier == "S4" && score > 100):
    //      tier = "S3" && score = (score - 100)
    // * 점수가 마이너스가 되면 세부티어가 바뀌고 마이너스값 만큼 점수 깎임.
    //   if (tier == "S2" && score < 0):
    //      tier = "S3" && score = (score + 100)
    // * 점수가 마이너스지만 티어 뒷자리 숫자가 4 라면 티어 그대로 유지에 점수도 0.
    //   if (tier == "*4" && score < 0):
    //      tier = "*4" && score = 0

    let updatedTier = currentTier;
    let updatedScore = currentScore;

    // (1) 티어가 마스터(M), 그랜드마스터(GM), 챌린저(C)일 경우
    if (["M", "GM", "C"].includes(currentTier)) {
      // TODO: 여기는 랭킹에 따라 다르므로 나중에 구현
      // TODO: 마스터, 그랜드마스터, 챌린저 랭킹 정하는것도 해야할 경우.
      //       "user" database에서 "M", "GM", "C"인 사람들 필터 후 score값으로 줄세운 다음 순위에 따라 티어 업데이트.
      // TODO: 그랜드마스터 티어의 경우.
      //       만약 마스터 이상 유저 수가 30명 미만일 경우 어떻게 할지 정해야 할듯.
      // TODO: 챌린터 티어의 경우.
      //       만약 그랜드마스터 유저가 3명 미만일 경우 어떻게 할지 정해야 할듯.

      // 책임자 코멘트:
      // 강등 안되는게 원래 로직이니까 일단은 강등 안되는걸로 ㄱㄱ
      // 돌려보면서 티어 보상에 대한 경험 피드백 받아야 할 듯
      // 물어봐줘서 고맙다 해줘 ㅋㅋ 마티(마스터티어 인듯?)는 원래 강등돼야하니까 물어봐준거같은데
      if (currentScore < 0) {
        updatedScore = 0;
      }

      // (2) 티어가 아이언 ~ 다이아몬드일 경우
    } else {
      // 점수가 0 이상 99 이하라면 그대로 유지.
      // 점수가 0 미만 혹은 100 이상이라면 티어 변경.
      if (currentScore < 0 || currentScore >= 100) {
        // [아이언] 티어
        // 아이언4
        if (currentTier === "I4" && currentScore < 0) {
          updatedTier = "I4";
          updatedScore = 0;
        } else if (currentTier === "I4" && currentScore >= 100) {
          updatedTier = "I3";
          updatedScore = currentScore - 100;
          // 아이언3
        } else if (currentTier === "I3" && currentScore < 0) {
          updatedTier = "I4";
          updatedScore = currentScore + 100;
        } else if (currentTier === "I3" && currentScore >= 100) {
          updatedTier = "I2";
          updatedScore = currentScore - 100;
          // 아이언2
        } else if (currentTier === "I2" && currentScore < 0) {
          updatedTier = "I3";
          updatedScore = currentScore + 100;
        } else if (currentTier === "I2" && currentScore >= 100) {
          updatedTier = "I1";
          updatedScore = currentScore - 100;
          // 아이언1
        } else if (currentTier === "I1" && currentScore < 0) {
          updatedTier = "I2";
          updatedScore = currentScore + 100;
        } else if (currentTier === "I1" && currentScore >= 100) {
          updatedTier = "B4";
          updatedScore = currentScore - 100;

          // [브론즈] 티어
          // 브론즈4
        } else if (currentTier === "B4" && currentScore < 0) {
          updatedTier = "B4";
          updatedScore = 0;
        } else if (currentTier === "B4" && currentScore >= 100) {
          updatedTier = "B3";
          updatedScore = currentScore - 100;
          // 브론즈3
        } else if (currentTier === "B3" && currentScore < 0) {
          updatedTier = "B4";
          updatedScore = currentScore + 100;
        } else if (currentTier === "B3" && currentScore >= 100) {
          updatedTier = "B2";
          updatedScore = currentScore - 100;
          // 브론즈2
        } else if (currentTier === "B2" && currentScore < 0) {
          updatedTier = "B3";
          updatedScore = currentScore + 100;
        } else if (currentTier === "B2" && currentScore >= 100) {
          updatedTier = "B1";
          updatedScore = currentScore - 100;
          // 브론즈1
        } else if (currentTier === "B1" && currentScore < 0) {
          updatedTier = "B2";
          updatedScore = currentScore + 100;
        } else if (currentTier === "B1" && currentScore >= 100) {
          updatedTier = "S4";
          updatedScore = currentScore - 100;

          // [실버] 티어
          // 실버4
        } else if (currentTier === "S4" && currentScore < 0) {
          updatedTier = "S4";
          updatedScore = 0;
        } else if (currentTier === "S4" && currentScore >= 100) {
          updatedTier = "S3";
          updatedScore = currentScore - 100;
          // 실버3
        } else if (currentTier === "S3" && currentScore < 0) {
          updatedTier = "S4";
          updatedScore = currentScore + 100;
        } else if (currentTier === "S3" && currentScore >= 100) {
          updatedTier = "S2";
          updatedScore = currentScore - 100;
          // 실버2
        } else if (currentTier === "S2" && currentScore < 0) {
          updatedTier = "S3";
          updatedScore = currentScore + 100;
        } else if (currentTier === "S2" && currentScore >= 100) {
          updatedTier = "S1";
          updatedScore = currentScore - 100;
          // 실버1
        } else if (currentTier === "S1" && currentScore < 0) {
          updatedTier = "S2";
          updatedScore = currentScore + 100;
        } else if (currentTier === "S1" && currentScore >= 100) {
          updatedTier = "G4";
          updatedScore = currentScore - 100;

          // [골드] 티어
          // 골드4
        } else if (currentTier === "G4" && currentScore < 0) {
          updatedTier = "G4";
          updatedScore = 0;
        } else if (currentTier === "G4" && currentScore >= 100) {
          updatedTier = "G3";
          updatedScore = currentScore - 100;
          // 골드3
        } else if (currentTier === "G3" && currentScore < 0) {
          updatedTier = "G4";
          updatedScore = currentScore + 100;
        } else if (currentTier === "G3" && currentScore >= 100) {
          updatedTier = "G2";
          updatedScore = currentScore - 100;
          // 골드2
        } else if (currentTier === "G2" && currentScore < 0) {
          updatedTier = "G3";
          updatedScore = currentScore + 100;
        } else if (currentTier === "G2" && currentScore >= 100) {
          updatedTier = "G1";
          updatedScore = currentScore - 100;
          // 골드1
        } else if (currentTier === "G1" && currentScore < 0) {
          updatedTier = "G2";
          updatedScore = currentScore + 100;
        } else if (currentTier === "G1" && currentScore >= 100) {
          updatedTier = "P4";
          updatedScore = currentScore - 100;

          // [플래티넘] 티어
          // 플래티넘4
        } else if (currentTier === "P4" && currentScore < 0) {
          updatedTier = "P4";
          updatedScore = 0;
        } else if (currentTier === "P4" && currentScore >= 100) {
          updatedTier = "P3";
          updatedScore = currentScore - 100;
          // 플래티넘3
        } else if (currentTier === "P3" && currentScore < 0) {
          updatedTier = "P4";
          updatedScore = currentScore + 100;
        } else if (currentTier === "P3" && currentScore >= 100) {
          updatedTier = "P2";
          updatedScore = currentScore - 100;
          // 플래티넘2
        } else if (currentTier === "P2" && currentScore < 0) {
          updatedTier = "P3";
          updatedScore = currentScore + 100;
        } else if (currentTier === "P2" && currentScore >= 100) {
          updatedTier = "P1";
          updatedScore = currentScore - 100;
          // 플래티넘1
        } else if (currentTier === "P1" && currentScore < 0) {
          updatedTier = "P2";
          updatedScore = currentScore + 100;
        } else if (currentTier === "P1" && currentScore >= 100) {
          updatedTier = "E4";
          updatedScore = currentScore - 100;

          // [에메랄드] 티어
          // 에메랄드4
        } else if (currentTier === "E4" && currentScore < 0) {
          updatedTier = "E4";
          updatedScore = 0;
        } else if (currentTier === "E4" && currentScore >= 100) {
          updatedTier = "E3";
          updatedScore = currentScore - 100;
          // 에메랄드3
        } else if (currentTier === "E3" && currentScore < 0) {
          updatedTier = "E4";
          updatedScore = currentScore + 100;
        } else if (currentTier === "E3" && currentScore >= 100) {
          updatedTier = "E2";
          updatedScore = currentScore - 100;
          // 에메랄드2
        } else if (currentTier === "E2" && currentScore < 0) {
          updatedTier = "E3";
          updatedScore = currentScore + 100;
        } else if (currentTier === "E2" && currentScore >= 100) {
          updatedTier = "E1";
          updatedScore = currentScore - 100;
          // 에메랄드1
        } else if (currentTier === "E1" && currentScore < 0) {
          updatedTier = "E2";
          updatedScore = currentScore + 100;
        } else if (currentTier === "E1" && currentScore >= 100) {
          updatedTier = "D4";
          updatedScore = currentScore - 100;

          // [다이아몬드] 티어
          // 다이아몬드4
        } else if (currentTier === "D4" && currentScore < 0) {
          updatedTier = "D4";
          updatedScore = 0;
        } else if (currentTier === "D4" && currentScore >= 100) {
          updatedTier = "D3";
          updatedScore = currentScore - 100;
          // 다이아몬드3
        } else if (currentTier === "D3" && currentScore < 0) {
          updatedTier = "D4";
          updatedScore = currentScore + 100;
        } else if (currentTier === "D3" && currentScore >= 100) {
          updatedTier = "D2";
          updatedScore = currentScore - 100;
          // 다이아몬드2
        } else if (currentTier === "D2" && currentScore < 0) {
          updatedTier = "D3";
          updatedScore = currentScore + 100;
        } else if (currentTier === "D2" && currentScore >= 100) {
          updatedTier = "D1";
          updatedScore = currentScore - 100;
          // 다이아몬드1
        } else if (currentTier === "D1" && currentScore < 0) {
          updatedTier = "D2";
          updatedScore = currentScore + 100;
        } else if (currentTier === "D1" && currentScore >= 100) {
          updatedTier = "M";
          updatedScore = currentScore - 100;
        }
      }
    }

    // req.user.tier = updatedTier;
    // req.user.score = updatedScore;
    // await AuthService.saveUser(req.user);

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
