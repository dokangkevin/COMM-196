const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function demoContext() {
  const values = new Map();
  const context = vm.createContext({
    console,
    Date,
    localStorage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, String(value)),
      removeItem: (key) => values.delete(key),
    },
  });
  const source = fs.readFileSync('data.js', 'utf8') + '\n' + fs.readFileSync('phase2-data.js', 'utf8') + `
    globalThis.fixture = { PERSONAS, CLUBS, STAFF_MEMBERSHIPS, APPLICATION_FORMS, APPLICATION_SUBMISSIONS, loadPhase2Store };
  `;
  vm.runInContext(source, context);
  return context.fixture;
}

test('student and staff demo identities are isolated', () => {
  const fixture = demoContext();
  assert.equal(fixture.PERSONAS.alex.name, 'Alex Chen');
  assert.equal(fixture.PERSONAS.staffdemo.name, 'ClubHub Staff Demo');
  assert.deepEqual(Array.from(fixture.PERSONAS.staffdemo.saved), []);
  const staff = fixture.STAFF_MEMBERSHIPS.find((item) => item.userId === 'staffdemo');
  assert.equal(staff.clubId, 'finance-association');
  assert.equal(staff.role, 'OWNER');
});

test('published forms are versioned and reference real clubs and opportunities', () => {
  const fixture = demoContext();
  assert.ok(fixture.APPLICATION_FORMS.length >= 3);
  for (const form of fixture.APPLICATION_FORMS) {
    const club = fixture.CLUBS.find((item) => item.id === form.clubId);
    assert.ok(club, `missing club ${form.clubId}`);
    assert.ok(club.opps.some((item) => item.title === form.opportunityTitle));
    assert.equal(form.status, 'PUBLISHED');
    assert.ok(form.questions.length > 0);
  }
});

test('student submissions preserve form version and staff review status', () => {
  const store = demoContext().loadPhase2Store();
  const finance = store.submissions.filter((item) => item.clubId === 'finance-association');
  assert.ok(finance.length >= 2);
  assert.ok(finance.every((item) => Number.isInteger(item.formVersion)));
  const submission = finance[0];
  submission.status = 'UNDER_REVIEW';
  assert.equal(store.submissions.find((item) => item.id === submission.id).status, 'UNDER_REVIEW');
});

test('interaction layer includes required accessible workflows', () => {
  const source = fs.readFileSync('phase2-ui.js', 'utf8');
  for (const behavior of ['recommendationsPage', 'applicationsPage', 'applicationFormModal', 'staffOverviewPage', 'staffRecruitmentPage', 'applicantsPage', 'extractProfileKeywords']) {
    assert.match(source, new RegExp(`function ${behavior}\\b`));
  }
  assert.match(source, /e\.key==='Escape'/);
  assert.match(source, /document\.body\.classList\.toggle\('modal-open'/);
  assert.match(source, /data-page="recommendations"/);
  assert.match(source, /data-page="saved"/);
  assert.match(source, /data-page="applications"/);
});
