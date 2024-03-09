module.exports = {
  extractJSON: (str) => {
    var firstOpen, firstClose, candidate;

    firstOpen = str.indexOf("{", firstOpen + 1);

    do {
      firstClose = str.lastIndexOf("}");

      if (firstClose <= firstOpen) {
        return null;
      }
      do {
        candidate = str.substring(firstOpen, firstClose + 1);

        try {
          var res = JSON.parse(candidate);
          // console.log("...found");
          return res;
        } catch (e) {
          // console.log("...failed");
        }
        firstClose = str.substr(0, firstClose).lastIndexOf("}");
      } while (firstClose > firstOpen);
      firstOpen = str.indexOf("{", firstOpen + 1);
    } while (firstOpen != -1);
  },
};
