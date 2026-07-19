const fs = require('fs');
const path = require('path');

const cartelsPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'components', 'Cartels.jsx');
let cartelsContent = fs.readFileSync(cartelsPath, 'utf8');

cartelsContent = cartelsContent.replace(
    "                </form>\n            </motion.div>\n        </div>\n    );\n};",
    "                </form>\n            </motion.div>\n            </div>\n        </div>\n    );\n};"
);
fs.writeFileSync(cartelsPath, cartelsContent);

const cartelViewPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'components', 'CartelView.jsx');
let cvContent = fs.readFileSync(cartelViewPath, 'utf8');

cvContent = cvContent.replace(
    "                </form>\n            </motion.div>\n        </div>\n    );\n};\n",
    "                </form>\n            </motion.div>\n            </div>\n        </div>\n    );\n};\n"
);
fs.writeFileSync(cartelViewPath, cvContent);

console.log('Fixed missing div tags');
