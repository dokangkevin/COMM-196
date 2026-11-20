from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
DATA = (ROOT / "data.js").read_text()
APP = (ROOT / "app.js").read_text()
HTML = (ROOT / "index.html").read_text()
SCHEMA = (ROOT / "prisma/schema.prisma").read_text()
CLUB_DATA = DATA.split("const CLUBS = [", 1)[1].split("];\n\nconst CATEGORY", 1)[0]


class ClubhubStaticTests(unittest.TestCase):
    def test_seed_has_at_least_twenty_clubs(self):
        self.assertGreaterEqual(CLUB_DATA.count('{id:"'), 20)

    def test_recruitment_and_events_are_seeded(self):
        self.assertGreaterEqual(CLUB_DATA.count("opportunity("), 8)
        self.assertGreaterEqual(CLUB_DATA.count("event("), 20)

    def test_four_distinct_personas_exist(self):
        persona_data = DATA.split("const PERSONAS = {", 1)[1].split("};", 1)[0]
        self.assertEqual(persona_data.count('onboarded:true'), 4)
        for name in ("Alex", "Maya", "Jordan", "Sam"):
            self.assertIn(name, persona_data)

    def test_primary_experiences_are_routed(self):
        for route in ("home", "discover", "dashboard", "calendar", "saved", "profile"):
            self.assertRegex(APP, rf"\b{route}\b")

    def test_core_interactions_are_implemented(self):
        for behavior in ("scoreClub", "fuzzyIncludes", "exportICS", "clubModal", "calendarEvents"):
            self.assertIn(f"function {behavior}", APP)
        self.assertIn("localStorage", APP)

    def test_accessible_shell(self):
        self.assertIn('lang="en"', HTML)
        self.assertIn('aria-live="polite"', HTML)
        self.assertIn('name="viewport"', HTML)

    def test_prisma_schema_has_required_models(self):
        for model in ("User", "StudentProfile", "Club", "RecruitmentOpportunity", "ClubEvent", "SavedClub"):
            self.assertIn(f"model {model}", SCHEMA)
        self.assertIn('@@id([studentId, clubId])', SCHEMA)

    def test_demo_mode_has_production_guard(self):
        auth = (ROOT / "src/services/current-user.ts").read_text()
        self.assertIn('process.env.NODE_ENV === "production"', auth)


if __name__ == "__main__":
    unittest.main(verbosity=2)
