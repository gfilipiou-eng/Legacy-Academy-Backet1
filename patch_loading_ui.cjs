const fs = require('fs');
let code = fs.readFileSync('legacy-academy-frontend/src/App.jsx', 'utf8');

// Patch 1: SIGN IN button loading text
const findSignIn = `<div className="w-5 h-5 text-black">\n                                                          <Icons.Loader />\n                                                      </div>\n                                                  ) : <span className="relative">SIGN IN</span>}`;
const replaceSignIn = `<div className="flex items-center justify-center gap-2">\n                                                          <div className="w-4 h-4 text-black"><Icons.Loader /></div>\n                                                          <span className="text-black text-[10px] font-black tracking-widest uppercase">WAKING UP SERVER (UP TO 50S)...</span>\n                                                      </div>\n                                                  ) : <span className="relative">SIGN IN</span>}`;

code = code.replace(findSignIn, replaceSignIn);

// Patch 2: CREATE ACCOUNT button loading text
const findCreate = `<div className="w-5 h-5 text-black">\n                                                          <Icons.Loader />\n                                                      </div>\n                                                  ) : <span className="relative">CREATE ACCOUNT</span>}`;
const replaceCreate = `<div className="flex items-center justify-center gap-2">\n                                                          <div className="w-4 h-4 text-black"><Icons.Loader /></div>\n                                                          <span className="text-black text-[10px] font-black tracking-widest uppercase">WAKING UP SERVER (UP TO 50S)...</span>\n                                                      </div>\n                                                  ) : <span className="relative">CREATE ACCOUNT</span>}`;

code = code.replace(findCreate, replaceCreate);

// Patch 3: PlatformLoadingPanel to show the sub-label
const findPlatformLoading = `<div className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--gold-primary)] relative z-10">\n                      {label}\n                  </div>\n              </div>\n          )}\n      </div>\n  );`;
const replacePlatformLoading = `<div className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--gold-primary)] relative z-10 text-center">\n                      {label}\n                  </div>\n                  <div className="text-[8px] font-bold uppercase tracking-[0.2em] text-[var(--gold-primary)]/50 mt-1">\n                      (Waking up secure server... may take 50s)\n                  </div>\n              </div>\n          )}\n      </div>\n  );`;

code = code.replace(findPlatformLoading, replacePlatformLoading);

fs.writeFileSync('legacy-academy-frontend/src/App.jsx', code);
console.log('Patched loading UI elements.');
