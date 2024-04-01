const moment = require("moment-timezone");

exports.getStartDayOfKST = (utcDate) =>
  moment(utcDate).tz("Asia/Seoul").startOf("day").format();

exports.getCurrentKST = () => moment(Date.now()).tz("Asia/Seoul").format();

exports.isTwentyFourHrsPassed = (currentKST, lastUpdateKST) => {
  const hoursPassed = moment(currentKST).diff(lastUpdateKST, "hours");
  return hoursPassed >= 24;
};
