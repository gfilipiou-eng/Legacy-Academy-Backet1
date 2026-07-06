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

        const fetchMatches = async () => {
            setLoading(true);
            try {
                // Try to fetch next events. 
                const resNext = await fetch(`https://www.thesportsdb.com/api/v1/json/3/eventsnext.php?id=${teamId}`);
                const dataNext = await resNext.json();

                if (dataNext && dataNext.events && dataNext.events.length > 0) {
                    const nextEvent = dataNext.events[0];
                    setMatch({
                        isReal: true,
                        isPast: false,
                        homeTeam: nextEvent.strHomeTeam,
                        awayTeam: nextEvent.strAwayTeam,
                        homeBadge: nextEvent.strHomeTeamBadge || (nextEvent.idHomeTeam === teamId ? team.strBadge : null),
                        awayBadge: nextEvent.strAwayTeamBadge || (nextEvent.idAwayTeam === teamId ? team.strBadge : null),
                        date: new Date(`${nextEvent.dateEvent}T${nextEvent.strTime}`),
                        league: nextEvent.strLeague,
                        status: nextEvent.strStatus
                    });
                } else {
                    // Try to fetch last events instead if next events are blocked/empty
                    const resLast = await fetch(`https://www.thesportsdb.com/api/v1/json/3/eventslast.php?id=${teamId}`);
                    const dataLast = await resLast.json();
                    
                    if (dataLast && dataLast.results && dataLast.results.length > 0) {
                        const lastEvent = dataLast.results[0];
                        setMatch({
                            isReal: true,
                            isPast: true,
                            homeTeam: lastEvent.strHomeTeam,
                            awayTeam: lastEvent.strAwayTeam,
                            homeScore: lastEvent.intHomeScore,
                            awayScore: lastEvent.intAwayScore,
                            homeBadge: lastEvent.strHomeTeamBadge || (lastEvent.idHomeTeam === teamId ? team.strBadge : null),
                            awayBadge: lastEvent.strAwayTeamBadge || (lastEvent.idAwayTeam === teamId ? team.strBadge : null),
                            date: new Date(`${lastEvent.dateEvent}`),
                            league: lastEvent.strLeague,
                            status: "FT"
                        });
                    } else {
                        setMatch(null); // No matches found
                    }
                }
            } catch (err) {
                console.error("Match fetch failed", err);
                setMatch(null);
            }
            setLoading(false);
        };

        fetchMatches();
    }, [team?.idTeam, team?.id]); // Use primitive dependencies to avoid infinite re-renders

    useEffect(() => {
        if (!match?.date || match.isPast) return;

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
        <div className={`relative overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.02] backdrop-blur-2xl shadow-sm ${className}`}>
            
            <div className="relative p-5">
                <div className="flex justify-between items-center mb-4 gap-2">
                    <div className="text-[10px] font-black uppercase tracking-widest text-white/50 shrink-0">
                        {loading ? "Locating Match..." : (match?.isPast ? "Latest Result" : "Next Match")}
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
                                <div className="w-12 h-12 sm:w-14 sm:h-14 mb-2 flex items-center justify-center bg-black rounded-full p-2 border border-white/10 shadow-sm shrink-0">
                                    {match.homeBadge ? (
                                        <img src={match.homeBadge} alt={match.homeTeam} className="w-full h-full object-contain" />
                                    ) : (
                                        <span className="text-xl">⚽</span>
                                    )}
                                </div>
                                <span className="text-[11px] sm:text-xs font-bold text-center text-white truncate w-full px-1">{match.homeTeam}</span>
                            </div>

                            {/* Score OR VS/Countdown */}
                            <div className="flex flex-col items-center justify-center shrink-0 min-w-[80px]">
                                {match.isPast ? (
                                    <div className="flex flex-col items-center">
                                        <div className="text-[10px] font-black text-white/40 mb-1 tracking-widest">FT</div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-3xl font-black text-white">{match.homeScore}</span>
                                            <span className="text-xl text-white/20 font-light">-</span>
                                            <span className="text-3xl font-black text-white">{match.awayScore}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="text-[10px] font-black text-white/40 italic mb-1">VS</div>
                                        {timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 ? (
                                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-[10px] uppercase px-3 py-1 rounded-full animate-pulse shadow-sm">
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
                                    </>
                                )}
                            </div>

                            {/* Away Team */}
                            <div className="flex flex-col items-center flex-1 min-w-0">
                                <div className="w-12 h-12 sm:w-14 sm:h-14 mb-2 flex items-center justify-center bg-black rounded-full p-2 border border-white/10 shadow-sm shrink-0">
                                    {match.awayBadge ? (
                                        <img src={match.awayBadge} alt={match.awayTeam} className="w-full h-full object-contain" />
                                    ) : (
                                        <span className="text-xl">⚽</span>
                                    )}
                                </div>
                                <span className="text-[11px] sm:text-xs font-bold text-center text-white truncate w-full px-1">{match.awayTeam}</span>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="text-center text-white/40 text-[11px] font-bold uppercase tracking-widest py-6">
                        No recent matches
                    </div>
                )}
            </div>
        </div>
    );
};

export default MatchWidget;
