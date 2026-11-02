// Daily pirate quest domain rules. Server is authoritative; never trust client timestamps.
export const DAILY_QUEST_DURATION_MS = 12 * 60 * 60 * 1000;
export const DAILY_QUEST_REWARDS = Object.freeze({all: 0.05, metal: 0.09, crystal: 0.09, fuel: 0.09});
export const dailyQuestDay = (time) => new Date(time).toISOString().slice(0, 10);

export function dailyQuestStatus(quest, time) {
  const today = dailyQuestDay(time);
  if (!quest || quest.day !== today) return 'available';
  return quest.claimedAt ? 'claimed' : quest.completedAt ? 'ready' : 'active';
}
export function acceptDailyQuest(quest, time) {
  if (dailyQuestStatus(quest, time) !== 'available') throw Error('Die tägliche Quest wurde bereits angenommen.');
  return {day: dailyQuestDay(time), acceptedAt: time, completedAt: null, claimedAt: null};
}
export function completeDailyQuest(quest, time, outcome) {
  if (dailyQuestStatus(quest, time) !== 'active' || outcome !== 'attacker' || time < quest.acceptedAt) return quest;
  return {...quest, completedAt: time};
}
export function claimDailyQuest(quest, reward, planetId, ownedPlanetIds, time, currentBonus) {
  if (dailyQuestStatus(quest, time) !== 'ready') throw Error('Die Piratenjagd ist noch nicht abgeschlossen.');
  if (!Object.hasOwn(DAILY_QUEST_REWARDS, reward)) throw Error('Ungültige Belohnung.');
  if (!ownedPlanetIds.includes(planetId)) throw Error('Dieser Planet gehört dir nicht.');
  if (currentBonus && currentBonus.expiresAt > time) throw Error('Es ist bereits ein Questbonus aktiv.');
  return {
    quest: {...quest, claimedAt: time},
    bonus: {planetId, reward, startedAt: time, expiresAt: time + DAILY_QUEST_DURATION_MS},
  };
}
export function dailyQuestMultiplier(bonus, planetId, resource, time) {
  if (!bonus || bonus.planetId !== planetId || time < bonus.startedAt || time >= bonus.expiresAt) return 1;
  return 1 + (bonus.reward === 'all' || bonus.reward === resource ? DAILY_QUEST_REWARDS[bonus.reward] : 0);
}
