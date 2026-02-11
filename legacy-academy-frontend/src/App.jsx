... existing code ...
                    {(!isChatOpen && !isProfileOpen && !isSettingsOpen && !isCreateOpen && !isEditOpen && !selectedPost) && (
                        <div className="fixed bottom-0 left-0 right-0 pb-1 flex justify-center z-[1000] pointer-events-none">
                            <div className="h-[40px] sm:h-[56px] w-full max-w-none rounded-[0.75rem] sm:rounded-[1.4rem] px-2 sm:px-3 flex items-center justify-between pointer-events-auto liquid-glass-nav floating-nav overflow-hidden">
                                <button onClick={() => { setActiveTab('home'); playSound('pop'); if (navigator.vibrate) navigator.vibrate(10); }} className={`nav-item-btn relative transition-all duration-300 z-10 ${activeTab === 'home' ? 'text-[var(--gold-primary)] scale-110 drop-shadow-[0_0_8px_var(--gold-glow)]' : 'text-gray-500 hover:text-white'}`}>
                                    <Icons.Home className="w-2.5 h-2.5 sm:w-4 sm:h-4 relative z-10" />
                                </button>

                                <button onClick={() => { setActiveTab('search'); playSound('pop'); if (navigator.vibrate) navigator.vibrate(10); }} className={`nav-item-btn relative transition-all duration-300 z-10 ${activeTab === 'search' ? 'text-[var(--gold-primary)] scale-110 drop-shadow-[0_0_8px_var(--gold-glow)]' : 'text-gray-500 hover:text-white'}`}>
                                    <Icons.Search className="w-2.5 h-2.5 sm:w-4 sm:h-4 relative z-10" />
                                </button>

                                <button onClick={() => { setActiveTab('alerts'); playSound('pop'); if (navigator.vibrate) navigator.vibrate(10); }} className={`nav-item-btn relative transition-all duration-500 z-10 ${activeTab === 'alerts' ? 'text-[var(--gold-primary)] scale-110 drop-shadow-[0_0_8px_rgba(255,215,0,0.6)]' : 'text-gray-500 hover:text-white'}`}>
                                    <div className="relative z-10">
                                        <Icons.Bell className={`w-2.5 h-2.5 sm:w-4 sm:h-4 ${user?.notifications?.some(n => !n.read) ? 'text-[var(--gold-primary)] fill-[var(--gold-primary)] animate-pulse drop-shadow-[0_0_10px_rgba(255,215,0,0.8)]' : ''}`} />
                                        {user?.notifications?.some(n => !n.read) && <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-red-600 rounded-full border border-black shadow-[0_0_8px_rgba(220,38,38,0.8)] animate-ping-slow" />}
                                    </div>
                                </button>

                                <button onClick={() => { logout(); playSound('sword'); }} className="nav-logout-btn text-red-500 hover:text-red-600 transition-all z-10 hover:scale-110 active:scale-95"><Icons.Logout className="w-2.5 h-2.5 sm:w-4 sm:h-4 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" /></button>

                                <button onClick={() => { viewProfile(user); playSound('pop'); }} className={`p-0.5 rounded-sm border-2 transition-all duration-300 z-10 ${activeTab === 'profile' ? 'border-[var(--gold-primary)] scale-110 shadow-[0_0_15px_rgba(255,215,0,0.3)]' : 'border-transparent'}`}>
                                    <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-sm sm:rounded-md overflow-hidden bg-white/10 relative">
                                        <ProfileAvatar user={user} key={imgKey} />
                                    </div>
                                </button>
                            </div>
                        </div>
                    )}
... existing code ...