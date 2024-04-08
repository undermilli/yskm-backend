// 실험중
const AuthService = require("../services/auth.service");

const { MongoClient } = require("mongodb");
const { update } = require("./user.controller");
const uri =
  "mongodb+srv://developers:djsejalffl1234@undermilli.u8syqsv.mongodb.net/?retryWrites=true&w=majority&appName=Undermilli";
const client = new MongoClient(uri);

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

///////////////
// FUNCTIONS //
///////////////

// [info] 연습용. 그냥 Hello 출력함.
// [accessDB] 연습용. 실제 db에 access하는 연습함.
// [setTier] 원래 연습용 이었는데 이 function을 앱의 도입부로 할까 싶음.
//           여기서 배치고사냐 일반문제냐 나눠지도록 하는 계획중.
// [filterQuestionsBasedOnTier] User의 현재 tier에 따라 제출가능문제를 db에서 불러오는 function.
//                              이거는 현재 그냥 function call 할때마다 전체 db에 access해서 불러옴.
//                              이거는 이제 쓰이지 않을것.
// [updateTierAndScore] User의 현재 tier와 score에 맞는 tier와 score를 업데이트하는 function.
//                      현재는 문제의 정답/오답 유무에 따라 score가 update 되고난 이후 이 function으로 들어온다는 가정하에 작성함.
// [getMultipleChoiceAnswers] 사지선다로 가능한 모든 Player Name을 중복없이 array에 저장하는 function.
//                            현재는 모든 Player Name을 불러옴.
// [tierPlacementQuestions] 여기서 티어배치고사 문제 기능 구현할 예정.
// [normalQuestions] 여기서 일반 문제 기능 구현할 예정.

// [updateQuestionsInDatabase] quiz_questions DB에 원본 데이터 + TIER field 추가한 데이터 저장하는거.
//                             일단 그 DB에 존재하는 모든 데이터를 지운 이후 업데이트함.
// [getQuestions] 이거는 "TIER" field가 추가된 db를 통해 Questions 불러오는거.
//                이게 user의 현재 티어에 맞는 모든

////////////////////////////////////////
// Global variables는 사용하면 안됨!!! //
////////////////////////////////////////
// // 실험중 ////
// let multipleChoiceAnswers =[];
// let hasTierChanged = false;   // if true, query new questions
// let possibleQuestions;
// /////////

exports.info = async (req, res) => {
  res.json("Hello!");
};

exports.accessDB = async (req, res) => {
  try {
    await client.connect();

    const db = client.db("sample_data");
    // const coll = db.collection("sample_data");
    const coll = db.collection("final_real_data");

    // Get the user's current score from the request object
    const userScore = req.user.score;

    console.log(`이게 유저 점수임 ${userScore}`);

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
    console.log(`이게 업데이트 이후 유저 점수임 ${req.user.score}`);
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

exports.filterQuestionsBasedOnTier = async (req, res) => {
  try {
    await client.connect();

    const db = client.db("sample_data");
    const coll = db.collection("final_real_data");

    const currentTier = req.user.tier;

    // Define filter based on the user's tier
    let filter;

    // [아이언] 정답 전부 페이커
    if (["I4", "I3", "I2", "I1"].includes(currentTier)) {
      filter = { IGN: "FAKER" };
    }

    // [브론즈] 2023년 티원, 젠지 + 5인 (Showmaker, Deft, Kiin, Canyon, BDD)
    if (["B4", "B3", "B2", "B1"].includes(currentTier)) {
      filter = {
        $or: [
          { YEAR: 23, TEAM: "T1" },
          { YEAR: 23, TEAM: "Gen.G" },
          { IGN: { $in: ["Showmaker", "Deft", "Kiin", "Canyon", "BDD"] } },
        ],
      };
    }

    // [실버] 2021 ~ 2023 LCK
    if (["S4", "S3", "S2", "S1"].includes(currentTier)) {
      filter = { $and: [{ YEAR: { $in: [21, 22, 23] } }, { LEAGUE: "LCK" }] };
    }

    // [골드] 2021 ~ 2023 4대리그 (LCK, LPL, LEC, LCS) (골드, 플래티넘 동일)
    if (["G4", "G3", "G2", "G1"].includes(currentTier)) {
      filter = {
        $and: [
          { YEAR: { $in: [21, 22, 23] } },
          { LEAGUE: { $in: ["LCK", "LPL", "LEC", "LCS"] } },
        ],
      };
    }

    // [플래티넘] 2021 ~ 2023 4대리그 (LCK, LPL, LEC, LCS) (골드, 플래티넘 동일)
    if (["P4", "P3", "P2", "P1"].includes(currentTier)) {
      filter = {
        $and: [
          { YEAR: { $in: [21, 22, 23] } },
          { LEAGUE: { $in: ["LCK", "LPL", "LEC", "LCS"] } },
        ],
      };
    }

    // [에메랄드] 2018 ~ 2023 4대리그 (LCK, LPL, LEC, LCS)
    if (["E4", "E3", "E2", "E1"].includes(currentTier)) {
      filter = {
        $and: [
          { YEAR: { $in: [18, 19, 20, 21, 22, 23] } },
          { LEAGUE: { $in: ["LCK", "LPL", "LEC", "LCS"] } },
        ],
      };
    }

    // [다이아몬드] 2015 ~ 2023 4대리그 (LCK, LPL, LEC, LCS) (다이아몬드, 마스터 동일)
    if (["D4", "D3", "D2", "D1"].includes(currentTier)) {
      filter = {
        $and: [
          { YEAR: { $in: [15, 16, 17, 18, 19, 20, 21, 22, 23] } },
          { LEAGUE: { $in: ["LCK", "LPL", "LEC", "LCS"] } },
        ],
      };
    }

    // [마스터] 2015 ~ 2023 4대리그 (LCK, LPL, LEC, LCS) (다이아몬드, 마스터 동일)
    if (currentTier === "M") {
      filter = {
        $and: [
          { YEAR: { $in: [15, 16, 17, 18, 19, 20, 21, 22, 23] } },
          { LEAGUE: { $in: ["LCK", "LPL", "LEC", "LCS"] } },
        ],
      };
    }

    // [그랜드마스터] 2013 ~ 2023 4대리그 (LCK, LPL, LEC, LCS)
    if (currentTier === "GM") {
      filter = {
        $and: [
          { YEAR: { $in: [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23] } },
          { LEAGUE: { $in: ["LCK", "LPL", "LEC", "LCS"] } },
        ],
      };
    }

    // [챌린저] 전체 db
    if (currentTier === "C") {
      filter = {};
    }

    // Find documents matching the filter
    const cursor = coll.find(filter);

    ///// 실험중 //////
    const count = await cursor.count();
    console.log(`총 리턴된 documents 갯수: ${count}`);
    //////////////////

    // 아이언: 11개
    // 브론즈: 17개
    // 실버: 208개
    // 골드: 860개
    // 플래티넘: 860개
    // 에메랄드: 1762개
    // 다이아몬드: 2739개
    // 마스터: 2739개
    // 그랜드마스터: 3313개
    // 챌린저: 3502개

    // Collect the questions in an array
    const questions = await cursor.toArray();

    // Send the questions as a JSON response
    res.json(questions);
  } catch (error) {
    console.error("Error fetching questions:", error);
    res.status(500).json({ error: "Failed to fetch questions" });
  } finally {
    // Close the MongoDB client connection
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

    console.log(`현재 티어 ${currentTier}`);
    console.log(`현재 점수 ${currentScore}`);
    console.log(`새로운 티어 ${updatedTier}`);
    console.log(`새로운 점수 ${updatedScore}`);

    // TODO: 어떻게 user info 받냐에 따라서 둘중 한가지 저장방법 쓸것.

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

// TODO: (getQuestions) 티어에 맞는 정답 범위의 모든 문제들을 가져오는 function.
// TODO: (updateTierAndScore) 점수 변동에 따른 티어, 점수변동 유무 확인하고 티어와 점수 set하는 function.

// TODO: 문제 만들고 정답/오답 확인하는 function ???
//       이 경우 function 하나는 티어배치고사 문제 function, 다른 하나는 일반 문제 function.
//       현재 생각은, 티어배치고사 문제 function의 경우 loop 5번 돌려서 각 loop에서 문제출제후 점수업데이트, loop 끝나면 종료.
//       일반 문제 function의 경우 무한 loop, 클라이언트가 "퀴즈종료버튼"이나 "창닫기" 등의 request를 보낼경우 무한 loop 종료.

// TODO: 점수 문제랑 답안을 만들경우.
//       티어가 변경되지 않는다면 variable에 해당티어 범위문제들 저장해서 latency 줄이는것도 방법일듯.
//       또한 답안의 경우 어짜피 Player Name들이 될테니 미리 variable에 모든 documents 쿼리해서 unique한 Player Name값들 저장해놓으면 될듯.

exports.getMultipleChoiceAnswers = async (req, res) => {
  // TODO: 데이터베이스에 있는 모든 Player Name을 사지선다에 보여줄지,
  //       아니면 해당 티어 문제들에 있는 Player Name만들 사지선다에 보여줄지 정해야할듯.
  //       밑에 코드는 일단 모든 Player Name.

  // TODO: 이 function을 쓴다면, 아마 배치고사 문제나 일반 문제 function이 call 됐을때 맨 위에서 loop 전에 한번 쓸듯.
  //       (즉, variable이 리셋되지 않는 범위에서 쓸듯)

  try {
    await client.connect();

    const db = client.db("sample_data");
    const coll = db.collection("final_real_data");

    // Define filter based on the user's tier
    let filter = {};

    // Find documents matching the filter
    const cursor = coll.find(filter);

    // Use a set to collect unique values of "IGN"
    let uniqueAnswers = new Set();

    // Iterate over the cursor
    await cursor.forEach((doc) => {
      if (doc.IGN) {
        // Ensure the document has the "IGN" field
        uniqueAnswers.add(doc.IGN); // Add the value of "IGN" to the set
      }
    });

    // Convert the set to an array and assign it to the global variable
    multipleChoiceAnswers = Array.from(uniqueAnswers);

    // Send the unique answers as a JSON response
    res.json({ answers: multipleChoiceAnswers });

    console.log(`리턴된 플레이어 아이디 ${multipleChoiceAnswers}`);
    console.log(`리턴된 플레이어 아이디 갯수 ${multipleChoiceAnswers.length}`);
  } catch (error) {
    console.error("Error fetching answers:", error);
    res.status(500).json({ error: "Failed to fetch answers" });
  } finally {
    // Close the MongoDB client connection
    await client.close();
  }
};

////////////////
// 티어 시스템 //
////////////////
// --------------------------------
// 아이언 4, 3, 2, 1
// 브론즈 4, 3, 2, 1
// 실버 4, 3, 2, 1
// 골드 4, 3, 2, 1
// 플래티넘 4, 3, 2, 1
// 에메랄드 4, 3, 2, 1
// 다이아몬드 4, 3, 2, 1
// 마스터
// 그랜드마스터
// 챌린저
// ---------------------------------
// I4, I3, I2, I1        (아이언)
// B4, B3, B2, B1        (브론즈)
// S4, S3, S2, S1        (실버)
// G4, G3, G2, G1        (골드)
// P4, P3, P2, P1        (플래티넘)
// E4, E3, E2, E1        (에메랄드)
// D4, D3, D2, D1        (다이아몬드)
// M                     (마스터)
// GM                    (그랜드마스터)
// C                     (챌린저)

/////////////////////////////
// 티어배치고사 문제 (5문제) //
/////////////////////////////
// 최종 점수에 따른 티어 배치
// 0 pt    => I4, 0 pt
// 400 pt  => B4, 0 pt
// 800 pt  => S4, 0 pt
// 1200 pt => G4, 0 pt
// 1600 pt => P4, 0 pt
// 2000 pt => E4, 0 pt

// 맞히면 +400 pt, 틀리면 -400 pt.
//
// 1 <= question_num <= 5
// 0 <= score <= 2000
// 즉 점수 업데이트 시, if (score < 0):
//                        score = 0
//
// if (question_num <= 5 && score = 0):
//    아이언 문제 뽑아서 출제, 점수 업데이트
// if (question_num <= 5 && score = 400):
//    브론즈 문제 뽑아서 출제, 점수 업데이트
// if (question_num <= 5 && score = 800):
//    실버 문제 뽑아서 출제, 점수 업데이트
// if (question_num <= 5 && score = 1200):
//    골드 문제 뽑아서 출제, 점수 업데이트
// if (question_num <= 5 && score = 1600):
//    플래티넘 문제 뽑아서 출제, 점수 업데이트
exports.tierPlacementQuestions = async (req, res) => {
  score = 0;

  // 5문제 출제
  for (let i = 0; i < 5; i++) {
    // 정답일 경우 +400
    // 오답일 경우 -400 (0점이면 그대로 0점)
  }

  // Update tier and score based on the final score.
  if (score === 0) {
    // 배치결과 아이언4
  } else if (score === 400) {
    // 배치결과 브론즈4
  } else if (score === 800) {
    // 배치결과 실버4
  } else if (score === 1200) {
    // 배치결과 골드4
  } else if (score === 1600) {
    // 배치결과 플래티넘4
  } else if (score === 2000) {
    // 배치결과 에메랄드4
  }
};

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
exports.normalQuestions = async (req, res) => {};

// TODO
// [getQuestions] 이거는 "TIER" field가 추가된 db를 통해 Question 불러오는거.
//                    TIER field는 [I, B, S, ....] 이런식으로 만들 생각.
// [updateQuestionsInDatabase] 이거는 quiz_questions DB를 새로 만드는거.
//                             일단 현재로써는 기존에 존재하는 DB 다 지우고 새로 만드는걸로 진행.

////////////////////////////
// 티어별 문제들 db에 저장 //
////////////////////////////
exports.updateQuestionsInDatabase = async (req, res) => {
  try {
    await client.connect();

    const allDB = client.db("sample_data");
    const quizDB = client.db("quiz_questions");
    const sourceColl = allDB.collection("final_real_data");
    const targetColl = quizDB.collection("quiz_questions");

    // Delete all documents in the target collection.
    await targetColl.deleteMany({});

    // 실험중 //////////
    const testing = await targetColl.find().toArray();
    console.log(`잘 지워졌으면 이거 0이어야됨: ${testing.length}`);

    ////////////////////

    // Fetch all documents from the source collection.
    const documents = await sourceColl.find().toArray();

    for (let doc of documents) {
      // Get the tier information of each document.
      const tiers = determineTiers(doc);

      // Add the TIER field to the document
      doc.TIER = tiers;

      // Insert the document into the target collection
      await targetColl.insertOne(doc);
    }

    console.log(`잘 업데이트 되면 숫자 나옴: ${documents.length}`);

    res.json({
      message: "Successfully updated quiz questions",
      count: documents.length,
    });
  } catch (error) {
    console.error("Error updating questions:", error);
    res.status(500).json({ error: "Failed to update questions" });
  } finally {
    // Close the MongoDB client connection
    await client.close();
  }
};

// 실험중 ////////////////////////////////////////////////
exports.testHowManyDocs = async (req, res) => {
  try {
    await client.connect();

    const db = client.db("quiz_questions");
    const coll = db.collection("quiz_questions");

    const currentTier = req.user.tier;

    // Adjust the filter to check if the currentTier is in the TIER array of the document
    const filter = { TIER: { $in: [currentTier] } };
    const cursor = coll.find(filter);

    const count = await cursor.count();
    console.log(`티어 ${currentTier}에 리턴된 document 숫자는 ${count}`);

    // If you only want to return the count of documents instead of the documents themselves
    res.json({ tier: currentTier, count: count });

    // If you still want to return the documents as well
    // const questions = await cursor.toArray();
    // res.json({ tier: currentTier, count: count, questions: questions });

    // // 아이언: 11개
    // // 브론즈: 17개
    // // 실버: 208개
    // // 골드: 860개
    // // 플래티넘: 860개
    // // 에메랄드: 1762개
    // // 다이아몬드: 2739개
    // // 마스터: 2739개
    // // 그랜드마스터: 3313개
    // // 챌린저: 3502개
  } catch (error) {
    console.error("Error fetching questions:", error);
    res.status(500).json({ error: "Failed to fetch questions" });
  } finally {
    // Close the MongoDB client connection
    await client.close();
  }
};
////////////////////////////////////////////////////

function determineTiers(doc) {
  let tiersSet = new Set();

  // [아이언] 정답 전부 페이커
  if (doc.IGN === "FAKER") {
    ["I4", "I3", "I2", "I1"].forEach((element) => tiersSet.add(element));
  }
  // [브론즈] 2023년 티원, 젠지 + 5인 (Showmaker, Deft, Kiin, Canyon, BDD)
  if (
    (doc.YEAR === 23 && doc.TEAM === "T1") ||
    (doc.YEAR === 23 && doc.TEAM === "Gen.G") ||
    ["Showmaker", "Deft", "Kiin", "Canyon", "BDD"].includes(doc.IGN)
  ) {
    ["B4", "B3", "B2", "B1"].forEach((element) => tiersSet.add(element));
  }
  // [실버] 2021 ~ 2023 LCK
  if ([21, 22, 23].includes(doc.YEAR) && doc.LEAGUE === "LCK") {
    ["S4", "S3", "S2", "S1"].forEach((element) => tiersSet.add(element));
  }
  // [골드] 2021 ~ 2023 4대리그 (LCK, LPL, LEC, LCS) (골드, 플래티넘 동일)
  if (
    [21, 22, 23].includes(doc.YEAR) &&
    ["LCK", "LPL", "LEC", "LCS"].includes(doc.LEAGUE)
  ) {
    ["G4", "G3", "G2", "G1"].forEach((element) => tiersSet.add(element));
  }
  // [플래티넘] 2021 ~ 2023 4대리그 (LCK, LPL, LEC, LCS) (골드, 플래티넘 동일)
  if (
    [21, 22, 23].includes(doc.YEAR) &&
    ["LCK", "LPL", "LEC", "LCS"].includes(doc.LEAGUE)
  ) {
    ["P4", "P3", "P2", "P1"].forEach((element) => tiersSet.add(element));
  }
  // [에메랄드] 2018 ~ 2023 4대리그 (LCK, LPL, LEC, LCS)
  if (
    [18, 19, 20, 21, 22, 23].includes(doc.YEAR) &&
    ["LCK", "LPL", "LEC", "LCS"].includes(doc.LEAGUE)
  ) {
    ["E4", "E3", "E2", "E1"].forEach((element) => tiersSet.add(element));
  }
  // [다이아몬드] 2015 ~ 2023 4대리그 (LCK, LPL, LEC, LCS) (다이아몬드, 마스터 동일)
  if (
    [15, 16, 17, 18, 19, 20, 21, 22, 23].includes(doc.YEAR) &&
    ["LCK", "LPL", "LEC", "LCS"].includes(doc.LEAGUE)
  ) {
    ["D4", "D3", "D2", "D1"].forEach((element) => tiersSet.add(element));
  }
  // [마스터] 2015 ~ 2023 4대리그 (LCK, LPL, LEC, LCS) (다이아몬드, 마스터 동일)
  if (
    [15, 16, 17, 18, 19, 20, 21, 22, 23].includes(doc.YEAR) &&
    ["LCK", "LPL", "LEC", "LCS"].includes(doc.LEAGUE)
  ) {
    tiersSet.add("M");
  }
  // [그랜드마스터] 2013 ~ 2023 4대리그 (LCK, LPL, LEC, LCS)
  if (
    [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23].includes(doc.YEAR) &&
    ["LCK", "LPL", "LEC", "LCS"].includes(doc.LEAGUE)
  ) {
    tiersSet.add("GM");
  }
  // [챌린저] 전체 db
  tiersSet.add("C");

  // Convert the set to an array
  let tiers = Array.from(tiersSet);

  return tiers;
}

////////////////////////////////////////
// 새로 작성하는 getQuestions function //
////////////////////////////////////////
// this is not used in the current implementation (to remove ?)
exports.getQuestions = async (req, res) => {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
    const db = client.db("yksm");
    const coll = db.collection("userdb");
    const currentTier = req.user.tier;

    // Adjust filter to check if the current tier is within the TIER array
    let filter = { TIER: { $in: [currentTier] } };

    // Find documents matching the filter
    const cursor = coll.find(filter);

    ///// 실험중 //////
    const count = await cursor.count();
    console.log(`티어 ${currentTier}로 리턴된 documents 갯수: ${count}`);
    //////////////////

    // 아이언: 11개
    // 브론즈: 17개
    // 실버: 208개
    // 골드: 860개
    // 플래티넘: 860개
    // 에메랄드: 1762개
    // 다이아몬드: 2739개
    // 마스터: 2739개
    // 그랜드마스터: 3313개
    // 챌린저: 3502개

    // Collect the questions in an array
    const questions = await cursor.toArray();

    // Send the questions as a JSON response
    res.json(questions);
  } catch (error) {
    console.error("Error fetching questions:", error);
    res.status(500).json({ error: "Failed to fetch questions" });
  } finally {
    // Close the MongoDB client connection
    // TODO:
    // It's generally a good practice to manage your MongoDB connection efficiently,
    // consider connecting once and reusing the connection, rather than connecting and closing per request.
    await client.close();
  }
};

////////////////////////////////////////////
// 문제랑 답 사지선다를 프론트에 보내는 로직 //
////////////////////////////////////////////
// 가능한 문제들 중에 예를들어 답이 "23년 CHOVY"라면, 이거는

// 1st API
// 문제를 generating 하는 동시에 문제DB를 만들어서 dbid를 받아와야됨
// retrun
//     {question:{2023, jungle.....},
//      multipleChoice:{실제답, 랜덤, 랜덤, 랜덤}<-순서도 랜덤
//      questionDBId:string} (이거는 문제에 있는 _id)
//    => 이거를 db에 저장. (+answer field도 같이 저장)

// 2nd API
// 그럼 이후에 user쪽에서 questionId + 고른 답을 api요청 보내면
// questionDB에서 id로 query해서 그게 고른 답이랑 맞는지를 계산해서 점수 업데이트
// return
//      {answer: ...,
//       status: ...  }

//  마지막에
//  =====> DB에 이거 다 저장하고, 맞췄는지 틀렸는지 여부도 새로운 field로 저장.
//         + "createdAt" (자동생성된) 도 같이 저장.

// 최종적으로 db에 저장될 field는
// QUESTION
// MULTIPLECHOICE
// _ID
// ANSWER
// CREATEDAT
// STATUS  => 디폴트는 pending, 맞추면 TRUE, 틀리면 FALSE

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
    console.log("currentTier:", currentTier);
    // Fetch all documents that match the user's tier
    const questions = await coll.find(IRON_TIER_FILTER).toArray();
    if (questions.length === 0) {
      return res
        .status(404)
        .json({ error: "No questions found for this tier" });
    }

    // Randomly select one document..
    const selectedQuestion =
      questions[Math.floor(Math.random() * questions.length)];

    // Get 3 other multiple choice answers.
    const multipleChoices = await getOtherMultipleChoiceAnswers(
      selectedQuestion,
      coll,
      currentTier,
    );

    console.log("CHoices :", multipleChoices);
    // Shuffle the multipleChoices array
    const shuffledMultipleChoices = multipleChoices.sort(
      () => 0.5 - Math.random(),
    );

    // Save the question, multipleChoices, and the correct answer to the database
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

    // Constructing response with the details needed
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
  ////////////////////////////
  // 사지선다 가능한 경우의수 //
  ////////////////////////////
  // 이거는 1st API에 들어가는 function.

  // [년도 + 랜덤보기]
  // 가능한 문제들 중에 예를들어 답이 "23년 CHOVY"라면,
  // 모든 플레이어들 중 23년도에 활동한 모든 플레이어

  // [년도 + 동일리그]
  // 가능한 문제들 중에 예를들어 답이 "23년 CHOVY LCK"라면,
  // 모든 플레이어들 중 23년도에 LCK에서 활동한 모든 플레이어

  // [년도 + 동일리그 + 포지션]
  // 가능한 문제들 중에 예를들어 답이 "23년 CHOVY LCK MidLaner"라면,
  // 모든 플레이어들 중 23년도에 LCK에서 MinLaner로 활동한 모든 플레이어

  let filter;

  // 보기 난이도: 년도 + 랜덤보기 (아이언, 브론즈, 실버, 골드)
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
  }
  // 보기 난이도: 년도 + 동일리그 + 포지션 + 랜덤보기 (마스터, 그랜드마스터, 챌린저)
  else if (["M", "GM", "C"].includes(currentTier)) {
    filter = {
      YEAR: selectedQuestion.YEAR,
      LEAGUE: selectedQuestion.LEAGUE,
      POS: selectedQuestion.POS,
      IGN: { $ne: selectedQuestion.IGN }, // Exclude the selected document's IGN
    };
  }

  // Fetch documents that match the conditions
  const potentialAnswers = await coll.find(filter).toArray();
  console.log(`포텐셜 filter: ${filter}`);
  console.log(`포텐셜 답안들: ${potentialAnswers}`);
  // Shuffle the array and pick the first 3 IGNs
  const shuffled = potentialAnswers.sort(() => 0.5 - Math.random());
  const selectedIGNs = shuffled.slice(0, 3).map((doc) => doc.IGN);

  return [selectedQuestion.IGN, ...selectedIGNs]; // Ensure the correct answer is included
}

exports.getQuestions = async (req, res) => {};

/////////////////////
// 문제 난이도 필터 //
/////////////////////
// pdf 파일 표에 있는 "보기 난이도" 는 뭔지???

// // [아이언] 정답 전부 페이커
// if (["I4", "I3", "I2", "I1"].includes(tier)) {
//     filter = {IGN: "FAKER"};
// };

// // [브론즈] 2023년 티원, 젠지 + 5인 (Showmaker, Deft, Kiin, Canyon, BDD)
// if (["B4", "B3", "B2", "B1"].includes(tier)) {
//     filter = {$and: [
//         {YEAR: 23},
//         {TEAM: {$in: ["티원", "젠지"]}},
//         {IGN: {$in: ["Showmaker", "Deft", "Kiin", "Canyon", "BDD"]}}
//     ]};
// };

// // [실버] 2021 ~ 2023 LCK
// if (["S4", "S3", "S2", "S1"].includes(tier)) {
//     filter = {$and: [
//         {YEAR: {$in: [21, 22, 23]}},
//         {LEAGUE: "LCK"}
//     ]};
// };

// // [골드] 2021 ~ 2023 4대리그 (LCK, LPL, LEC, LCS) (골드, 플래티넘 동일)
// if (["G4", "G3", "G2", "G1"].includes(tier)) {
//     filter = {$and: [
//         {YEAR: {$in: [21, 22, 23]}},
//         {LEAGUE: {$in: ["LCK", "LPL", "LEC", "LCS"]}}
//     ]};
// };

// // [플래티넘] 2021 ~ 2023 4대리그 (LCK, LPL, LEC, LCS) (골드, 플래티넘 동일)
// if (["P4", "P3", "P2", "P1"].includes(tier)) {
//     filter = {$and: [
//         {YEAR: {$in: [21, 22, 23]}},
//         {LEAGUE: {$in: ["LCK", "LPL", "LEC", "LCS"]}}
//     ]};
// };

// // [에메랄드] 2018 ~ 2023 4대리그 (LCK, LPL, LEC, LCS)
// if (["E4", "E3", "E2", "E1"].includes(tier)) {
//     filter = {$and: [
//         {YEAR: {$in: [18, 19, 20, 21, 22, 23]}},
//         {LEAGUE: {$in: ["LCK", "LPL", "LEC", "LCS"]}}
//     ]}
// };

// // [다이아몬드] 2015 ~ 2023 4대리그 (LCK, LPL, LEC, LCS) (다이아몬드, 마스터 동일)
// if (["D4", "D3", "D2", "D1"].includes(tier)) {
//     filter = {$and: [
//         {YEAR: {$in: [15, 16, 17, 18, 19, 20, 21, 22, 23]}},
//         {LEAGUE: {$in: ["LCK", "LPL", "LEC", "LCS"]}}
//     ]}
// };

// // [마스터] 2015 ~ 2023 4대리그 (LCK, LPL, LEC, LCS) (다이아몬드, 마스터 동일)
// if (tier === "M") {
//     filter = {$and: [
//         {YEAR: {$in: [15, 16, 17, 18, 19, 20, 21, 22, 23]}},
//         {LEAGUE: {$in: ["LCK", "LPL", "LEC", "LCS"]}}
//     ]}
// };

// // [그랜드마스터] 2013 ~ 2023 4대리그 (LCK, LPL, LEC, LCS)
// if (tier === "GM") {
//     filter = {$and: [
//         {YEAR: {$in: [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23]}},
//         {LEAGUE: {$in: ["LCK", "LPL", "LEC", "LCS"]}}
//     ]}
// };

// // [챌린저] 전체 db
// if (tier === "C") {
//     filter = {}
// };
