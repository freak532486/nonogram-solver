import * as global from "./global.js"
import * as inputParsing from "./input-parsing.js"
import * as nonogramRebuild from "./nonogram-rebuild.js"

const onHintChange = () => {
    inputParsing.updateInputState();
    nonogramRebuild.updateNonogramHintLabels();
};

const onBoardResize = () => {
    inputParsing.updateInputState();
    nonogramRebuild.rebuildNonogramContainer();
};

global.inputRowHints.oninput = onHintChange;
global.inputColHints.oninput = onHintChange;

global.inputNumRows.oninput = onBoardResize;
global.inputNumCols.oninput = onBoardResize;