// Fictional observations collected by the player in each chapter.
export const records = [
  'A · Sleep shifted Thu 8. Symptoms returned Mon 12.',
  'B · Sleep shifted Sat 10. Symptoms returned Thu 15.',
  'C · Sleep shifted Tue 13. Symptoms returned Fri 16.',
  'D · Early waking on Mon 5, 12 and 19. Symptoms stayed stable.',
];
export const honors = ['Found both spare lab keys', 'Checked the comparison diary', 'Ruled out sensor error', 'Included the participant interview', 'Audited the lab clocks', 'Checked the counterexample'];
export const instructions = [
  'Find five gold gifts. Watch the five windows at the lab door, then walk inside.',
  'Pick up the sleep log. Carry it to the matching participant’s report. Tap your objective to inspect evidence.',
  'Four records disagree. Visit Maya or test the instrument, then bring evidence to the records desk.',
  'Collect the pilot result and its limitation. Take your evidence to grant review.',
  'Visit all three partner labs. Convert each reading to the same study hour.',
  'Collect the patterns from two sites. At synthesis, decide which observation survives comparison.',
];
export class Study {
  constructor(i, maze, route) {
    this.i = i;
    this.items = new Set();
    this.notes = [];
    this.solved = i === 0;
    const [a,b,c] = maze.gifts;
    const [k] = maze.clues;
    const optionalKey = Array.from(maze.dots.keys()).at(-1);
    const [x,y] = optionalKey.split(',').map(Number);
    const detour = {x,y};
    const swap = route ? [b,a] : [a,b];
    const station = (id, name, at) => ({id,name,at});
    const layouts = [
      [],
      [station('log','Log A',a),station('B','Report B',b),station('A','Report A',k),station('control','Diary C',detour)],
      [station('sensor','Sensor',swap[0]),station('maya','Maya',swap[1]),station('desk','Records',k)],
      [station('pilot','Pilot',swap[0]),station('limit','Limits',swap[1]),station('voice','Interview',c),station('desk','Review',k)],
      [station('east','East lab',a),station('west','West lab',route?c:b),station('home','Home lab',route?b:c),station('audit','Clock log',detour)],
      [station('one','Site A',swap[0]),station('two','Site B',swap[1]),station('control','Diary D',c),station('desk','Synthesis',k)],
    ];
    this.sites = layouts[i];
  }
  add(id, note) {
    this.items.add(id);
    this.notes.push(note);
  }
  get objective() {
    if (this.solved) return 'Find the remaining keys';
    const has = id => this.items.has(id);
    switch (this.i) {
      case 1: return has('log') ? 'Pair log A with its report' : 'Pick up sleep log A';
      case 2: return has('maya') ? 'Match the calendar at Records' : 'Investigate Maya or Sensor';
      case 3: return has('pilot') && has('limit') ? 'Take evidence to Review' : 'Gather pilot result and limits';
      case 4: return 'Sync partner labs · ' + ['east','west','home'].filter(has).length + '/3';
      default: return has('one') && has('two') ? 'Compare signals at Synthesis' : 'Gather site A and B readings';
    }
  }
  distinction(clues) {
    return [clues === 2, this.items.has('control'), this.items.has('sensor'), this.items.has('voice'), this.items.has('audit'), this.items.has('control')][this.i];
  }
  inspect(id) {
    const found = (note, done = false) => {
      this.add(id,note);
      if (done) this.solved = true;
      return {note};
    };
    const question = (note, answers, correct, reward, hint, done = true) => ({
      note, answers, hint, choose: n => {
        if (n !== correct) return false;
        found(reward,done);
        return true;
      }, reward,
    });
    if (this.items.has(id)) return null;
    if (id === 'log') return found('Log A · Earlier waking began on Thursday 8.');
    if (id === 'A') return this.items.has('log') ? found('Matched A · Sleep shifted Thursday 8. Symptoms returned Monday 12.',true) : {note:'Report A is here. Bring sleep log A to pair the dates.'};
    if (id === 'B') return found('Report B belongs to another participant. Check the ID on the log.');
    if (id === 'control') return found(this.i === 1 ? 'Comparison diary C shows different dates. Each participant needs their own pair.' : records[3]);
    if (id === 'sensor') return found('Instrument bench · The reference clock and sleep sensor agree. The Monday readings are real.');
    if (id === 'maya') return found('Maya’s calendar · “I opened the café on Mondays. My alarms were set for 4:45 on the 5th, 12th and 19th.”');
    if (id === 'pilot') return found('Pilot result · Three participants had a sleep change before their symptoms returned.');
    if (id === 'limit') return found('Study limitation · The small adult sample includes a work-schedule exception.');
    if (id === 'voice') return found('Participant interview · Maya wants the next study to record shift times alongside sleep.');
    if (id === 'audit') return found('Clock audit · All three lab clocks passed calibration. Their displays use different local offsets.');
    if (['east','west','home'].includes(id)) {
      const offset = {east:2,west:-1,home:0}[id];
      const local = 9 + offset;
      const answers = {east:['09:00','11:00','13:00'],west:['07:00','08:00','09:00'],home:['08:00','09:00','10:00']}[id];
      return question('The sample arrived at local hour ' + local + '. This clock is ' + Math.abs(offset) + ' hours ' + (offset < 0 ? 'behind' : 'ahead of') + ' study time. Tag it with its common study hour.', answers,answers.indexOf('09:00'),'Synchronized ' + id + ' lab at study hour 09:00.','Subtract the local offset to recover study time.',false);
    }
    if (id === 'one') return found('Site A · Early waking preceded returning symptoms in three diaries. A bright device spike appeared only once.');
    if (id === 'two') return found('Site B · Two diaries repeated the early-waking sequence. No device spike was recorded.');
    if (this.i === 2) return this.items.has('maya') ? question('Place Maya’s shift calendar beside the record it explains.',records,3,'Record D · Monday waking coincided with early work shifts.','Compare the three work dates with the diary dates.') : {note:'Four records are pinned here. Find evidence that explains the unusual dates.',cards:records};
    if (this.i === 3) {
      if (!this.items.has('pilot') || !this.items.has('limit')) return {note:'Reviewer’s request · Bring both the pilot result and the study limitation before resubmitting.'};
      return question('Select the dossier to send for NIH review.', ['Pilot + limitation + larger replication plan','Pilot + claim of universal prediction'],0,'Fictional NIH award · The pilot and its limitations justified testing the question in a larger group.','The reviewers need a plan that addresses the exception.');
    }
    return this.items.has('one') && this.items.has('two') ? question('Which observation repeated across the partner sites?', ['The bright instrument spike','Earlier waking before returning symptoms in some diaries'],1,'Across sites · A sleep change preceded returning symptoms for some participants.','Look for evidence present at both sites.') : {note:'The synthesis desk needs the observations from both sites.'};
  }
}
