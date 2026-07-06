import React, { useState, useEffect } from 'react';

const MatchWidget = ({ team, className = "" }) => {
    const [match, setMatch] = useState(null);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0 });

    useEffect(() => {
        const teamId = team?.idTeam || team?.id;
        if (!teamId) {
            setLoading(false);
            return;
        }

        const fetchNextMatch = async () => {
            setLoading(true);
            try {
                // Try to fetch next events. 
                // Note: TheSportsDB often locks this behind Patreon tier for some leagues.
                const res = await fetch(`https://www.thesportsdb.com/api/v1/json/3/eventsnext.php?id=${teamId}`);
                const data = await res.json();

                if (data && data.events && data.events.length > 0) {
                    const nextEvent = data.events[0];
                    setMatch({
                        isReal: true,
                        homeTeam: nextEvent.strHomeTeam,
                        awayTeam: nextEvent.strAwayTeam,
                        homeBadge: nextEvent.strHomeTeamBadge || (nextEvent.idHomeTeam === team.id ? team.strBadge : null),
                        awayBadge: nextEvent.strAwayTeamBadge || (nextEvent.idAwayTeam === team.id ? team.strBadge : null),
                        date: new Date(`${nextEvent.dateEvent}T${nextEvent.strTime}`),
                        league: nextEvent.strLeague,
                        status: nextEvent.strStatus
                    });
                } else {
                    // Graceful fallback to a premium mock if the API returns nothing or is restricted.
                    generateMockMatch();
                }
            } catch (err) {
                console.error("Match fetch failed, falling back to mock", err);
                generateMockMatch();
            }
            setLoading(false);
        };

        const generateMockMatch = () => {
            // Generate a fake match 3 days from now
            const mockDate = new Date();
            mockDate.setDate(mockDate.getDate() + 3);
            mockDate.setHours(20, 45, 0, 0);

            setMatch({
                isReal: false,
                homeTeam: team.strTeam,
                awayTeam: "Rival FC",
                homeBadge: team.strBadge,
                awayBadge: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Anonymous_emblem.svg/200px-Anonymous_emblem.svg.png", // Generic badge
                date: mockDate,
                league: "Championship Series",
                status: "Upcoming"
            });
        };

        fetchNextMatch();
    }, [team]);

    useEffect(() => {
        if (!match?.date) return;

        const updateCountdown = () => {
            const now = new Date();
            const difference = match.date - now;

            if (difference > 0) {
                const days = Math.floor(difference / (1000 * 60 * 60 * 24));
                const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
                const minutes = Math.floor((difference / 1000 / 60) % 60);
                setTimeLeft({ days, hours, minutes });
            } else {
                setTimeLeft({ days: 0, hours: 0, minutes: 0 });
            }
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 60000); // Update every minute
        return () => clearInterval(interval);
    }, [match]);

    if (!team) return null;

    return (
        <div className={`relative overflow-hidden rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl ${className}`}>
            {/* Ambient Background Glow */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/20 blur-3xl rounded-full"></div>
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-500/20 blur-3xl rounded-full"></div>
            
            <div className="relative p-5">
                <div className="flex justify-between items-center mb-4 gap-2">
                    <div className="text-[10px] font-black uppercase tracking-widest text-white/50 shrink-0">
                        {loading ? "Locating Match..." : "Next Match"}
                    </div>
                    {match && (
                        <div className="text-[9px] font-bold uppercase tracking-wider bg-white/10 px-2 py-0.5 rounded-full text-white/80 truncate max-w-[60%] text-right shrink">
                            {match.league}
                        </div>
                    )}
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-6">
                        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    </div>
                ) : match ? (
                    <>
                        <div className="flex items-center justify-between gap-2 sm:gap-4 w-full">
                            {/* Home Team */}
                            <div className="flex flex-col items-center flex-1 min-w-0">
                                <div className="w-12 h-12 sm:w-14 sm:h-14 mb-2 flex items-center justify-center bg-white/5 rounded-full p-2 border border-white/5 shadow-[0_0_15px_rgba(255,255,255,0.1)] shrink-0">
                                    {match.homeBadge ? (
                                        <img src={match.homeBadge} alt={match.homeTeam} className="w-full h-full object-contain drop-shadow-lg" />
                                    ) : (
                                        <span className="text-xl">⚽</span>
                                    )}
                                </div>
                                <span className="text-[11px] sm:text-xs font-bold text-center text-white truncate w-full px-1">{match.homeTeam}</span>
                            </div>

                            {/* VS / Countdown */}
                            <div className="flex flex-col items-center justify-center shrink-0">
                                <div className="text-[10px] font-black text-white/40 italic mb-1">VS</div>
                                {timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 ? (
                                    <div className="bg-red-500/20 border border-red-500/30 text-red-400 font-bold text-[10px] uppercase px-3 py-1 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.3)]">
                                        Live
                                    </div>
                                ) : (
                                    <div className="flex gap-1.5 text-center">
                                        <div className="bg-white/5 border border-white/10 rounded-lg w-9 py-1 flex flex-col items-center shadow-inner">
                                            <span className="text-sm font-black text-white leading-none">{timeLeft.days}</span>
                                            <span className="text-[8px] uppercase text-white/40 font-bold mt-0.5">Days</span>
                                        </div>
                                        <div className="text-white/20 font-black mt-1">:</div>
                                        <div className="bg-white/5 border border-white/10 rounded-lg w-9 py-1 flex flex-col items-center shadow-inner">
                                            <span className="text-sm font-black text-white leading-none">{timeLeft.hours}</span>
                                            <span className="text-[8px] uppercase text-white/40 font-bold mt-0.5">Hrs</span>
                                        </div>
                                        <div className="text-white/20 font-black mt-1">:</div>
                                        <div className="bg-white/5 border border-white/10 rounded-lg w-9 py-1 flex flex-col items-center shadow-inner">
                                            <span className="text-sm font-black text-white leading-none">{timeLeft.minutes}</span>
                                            <span className="text-[8px] uppercase text-white/40 font-bold mt-0.5">Min</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Away Team */}
                            <div className="flex flex-col items-center flex-1 min-w-0">
                                <div className="w-12 h-12 sm:w-14 sm:h-14 mb-2 flex items-center justify-center bg-white/5 rounded-full p-2 border border-white/5 shadow-[0_0_15px_rgba(255,255,255,0.1)] shrink-0">
                                    {match.awayBadge ? (
                                        <img src={match.awayBadge} alt={match.awayTeam} className="w-full h-full object-contain drop-shadow-lg" />
                                    ) : (
                                        <span className="text-xl">⚽</span>
                                    )}
                                </div>
                                <span className="text-[11px] sm:text-xs font-bold text-center text-white truncate w-full px-1">{match.awayTeam}</span>
                            </div>
                        </div>
                        
                        {!match.isReal && (
                            <div className="mt-4 text-[9px] text-center text-white/30 italic">
                                *Displaying simulated schedule
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center text-white/40 text-sm py-4">No upcoming matches found.</div>
                )}
            </div>
        </div>
    );
};

export default MatchWidget;
