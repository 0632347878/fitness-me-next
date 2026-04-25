# FITNESS MVP - Complete Application Guide

**Version:** 1.0  
**Date:** January 2025  
**Status:** MVP Ready  
**Document Type:** PDF (Ready to Print)

---

## TABLE OF CONTENTS

1. Application Overview
2. User Flow (Step-by-Step)
3. Business Logic Architecture
4. Feature List
5. User Instructions
6. Technical Architecture
7. FAQ

---

## 1. APPLICATION OVERVIEW

### What is Fitness MVP?

A mobile-first fitness platform that generates personalized workout programs based on user characteristics and allows athletes to track their progress through intelligent exercise logging.

### Who is it for?

- Skiers & snowboarders preparing for season
- Gym enthusiasts wanting structured training
- Kitesurfers needing sport-specific strength
- Anyone wanting data-driven fitness tracking

### Core Promise

**"Get a personalized workout program in 5 minutes, then track every rep with confidence"**

---

## 2. USER FLOW (Step-by-Step)

### PHASE 1: ONBOARDING (First 5 minutes)

#### Step 1: User Lands on App
```
URL: http://localhost:3000/
User sees: Landing page with CTA "Get Started Free"
User action: Clicks "Get Started" → goes to /auth/register
```

#### Step 2: Sign Up
```
URL: /auth/register
User enters: Name, Email, Password
Backend: Creates account, hashes password, stores in database
Result: Account created, user logged in automatically
```

#### Step 3: Complete Onboarding (6 Steps)
```
URL: /onboarding
Progress bar shows: 1/6 → 6/6

STEP 1 - Gender & Age:
- User selects: Male/Female/Other
- User enters: Age (15-100)
- Logic: Used for calculating muscle distribution

STEP 2 - Height & Weight:
- User enters: Height (cm), Weight (kg)
- Logic: Used for estimating starting weights for exercises

STEP 3 - Sport Selection:
- User selects: Skiing / Snowboarding / Gym / Kitesurfing
- Logic: Determines which muscle groups to prioritize

STEP 4 - Fitness Level:
- User selects: Beginner / Intermediate / Advanced
- Logic: Sets starting sets/reps and progression speed

STEP 5 - Available Equipment:
- User selects: Dumbbells, Barbell, Bodyweight, Cables, Machines
- Logic: Filters which exercises are available

STEP 6 - Training Days Per Week:
- User selects: 3-6 days
- User selects: Session duration (30-90 min)
- Logic: Distributes exercises across days
```

#### Step 3 Result: Program Generated
```
BACKEND PROCESS:
1. Calculates muscle distribution based on sport + level
   Example: Ski (Advanced) = 40% quads, 20% hamstrings, 15% glutes...

2. Selects exercises from ExerciseDB matching:
   - Target muscle groups (40% quads = 4-5 quad exercises)
   - Fitness level (Advanced = harder variations)
   - Available equipment (filter out unavailable exercises)

3. Creates 4-8 week periodization:
   Week 1-2: RAMP-UP (2x12 reps, light weight, form focus)
   Week 3-5: BUILD (3-4x8-10 reps, moderate weight)
   Week 6-7: PEAK (4x6 reps, heavy weight)
   Week 8: DELOAD (2x15 reps, recovery)

4. Saves program to database
5. Redirects user to /home
```

---

### PHASE 2: DAILY TRAINING (Weeks 1-8)

#### User Opens App (Every Day)
```
URL: /home
User sees:
- Week X • INTENSITY LEVEL
- Today's exercises (e.g., 4 exercises)
- Each exercise shows:
  - Name (e.g., "Barbell Back Squats")
  - Target muscle (e.g., "quads, glutes")
  - Prescribed: 3x10 @ 80kg (what they should do)
- "🏃 Start Workout" button
```

#### User Starts Workout
```
URL: /workout/exercise/0
User sees: First exercise details
- GIF animation of exercise
- Prescribed sets/reps/weight
- Input fields for actual performance
```

#### User Logs Exercise
```
USER INPUTS:
1. Sets (adjustment buttons +/-)
   Example: Prescribed 3, user did 3 ✓

2. Reps (adjustment buttons +/-)
   Example: Prescribed 10, user did 12 ✅ (progressed!)

3. Weight (adjustment buttons +/- 2.5kg)
   Example: Prescribed 80kg, user did 85kg ✅ (got stronger!)

4. RPE (Rate of Perceived Exertion 1-10)
   1 = Easy | 10 = Maximum effort
   Example: User rates 7 (challenging but doable)

5. Notes (optional)
   Example: "Felt strong, could do more"

CLICK: "✅ Log & Next"
```

#### Backend Processing
```
SYSTEM LOGIC:
1. Saves exercise log to database with:
   - What user actually did (3 sets, 12 reps, 85kg)
   - What was prescribed (3 sets, 10 reps, 80kg)
   - RPE rating
   - Timestamp

2. Calculates PROGRESSION:
   IF weight > prescribed: "weight_increase" ✅
   ELSE IF reps > prescribed: "reps_increase" ✅
   ELSE IF reps == prescribed AND rpe < 8: "easy" (can go heavier)
   ELSE IF rpe > 9: "very_hard" (might be too heavy)
   ELSE: "matched" (did exactly as prescribed)

3. Updates user stats

4. Shows next exercise (if available)
   Example: Exercise 2/4
```

#### Complete Workout
```
After final exercise logged:
- Shows: "Workout Complete! 🎉"
- Shows total duration, exercises logged
- Redirects to /home
```

---

### PHASE 3: PROGRESS TRACKING (After each week)

#### User Checks Progress
```
URL: /progress
User sees: Charts showing:
- Weight over time (e.g., 80kg → 85kg → 90kg)
- Personal records (PR) for each exercise
- Workout history
```

#### Algorithm: Personal Records
```
SYSTEM FINDS: Highest weight lifted for each exercise

Example (Barbell Squat):
Week 1: 80kg x 10 reps
Week 2: 82.5kg x 10 reps
Week 3: 85kg x 10 reps ← PR (maximum ever)

Shows user: "PR: 85kg 🏆"
```

---

## 3. BUSINESS LOGIC ARCHITECTURE

### Architecture Diagram

```
┌─────────────────────────────────────┐
│         USER INTERFACE              │
│     (Vue 3 / Nuxt 4 Components)     │
└────────────────┬────────────────────┘
                 │
┌────────────────▼────────────────────┐
│    COMPOSABLES & STORES             │
│  (useAuth, useWorkout, usePinia)    │
└────────────────┬────────────────────┘
                 │
┌────────────────▼────────────────────┐
│       BUSINESS LOGIC SERVICES       │
│  ProgramGenerator, WorkoutLogging   │
└────────────────┬────────────────────┘
                 │
┌────────────────▼────────────────────┐
│        HTTP API / ENDPOINTS         │
│   /api/programs/generate            │
│   /api/workouts/today               │
│   /api/logs/exercise                │
└────────────────┬────────────────────┘
                 │
┌────────────────▼────────────────────┐
│      DATABASE (MySQL)               │
│  users, programs, workouts, logs    │
└─────────────────────────────────────┘
```

### Key Algorithm: Program Generation

```
INPUT:
- Sport: "ski"
- Level: "advanced"
- Equipment: ["dumbbells", "barbell"]
- Days per week: 4
- Session duration: 60 min

STEP 1: MUSCLE DISTRIBUTION
Sport="ski" + Level="advanced" →
{
  quads: 35,        // 35% of exercises target quads
  hamstrings: 22,   // 22% target hamstrings
  glutes: 15,       // 15% target glutes
  core: 15,
  calves: 8,
  other: 5
}

STEP 2: SELECT EXERCISES
For QUADS (35%):
- Fetch from ExerciseDB: all exercises where target="quads"
- Filter by: level="advanced" AND equipment IN ["dumbbells", "barbell"]
- Result: ["Barbell Back Squat", "Bulgarian Split Squat", "Leg Press"]
- Take top 4 exercises

For HAMSTRINGS (22%):
- Fetch from ExerciseDB: target="hamstrings"
- Filter & select 2-3 exercises

...repeat for all muscle groups

STEP 3: CREATE PERIODIZATION
Weeks 1-2 (RAMP-UP):
  Sets: 2
  Reps: 12
  Intensity: Light
  Focus: Form & baseline fitness
  
Weeks 3-5 (BUILD):
  Sets: 3-4
  Reps: 8-10
  Intensity: Moderate
  Focus: Strength building
  
Weeks 6-7 (PEAK):
  Sets: 4
  Reps: 6
  Intensity: Heavy
  Focus: Maximum strength
  
Week 8 (DELOAD):
  Sets: 2
  Reps: 15
  Intensity: Light
  Focus: Recovery & tissue healing

STEP 4: DISTRIBUTE ACROSS DAYS
4 days/week = distribute 12 exercises
- Monday: Exercises 1-3
- Tuesday: Exercises 4-6
- Thursday: Exercises 7-9
- Saturday: Exercises 10-12

OUTPUT:
Complete 8-week personalized program saved to database
```

### Key Algorithm: Progression Detection

```
USER LOGS:
- Prescribed: 3 sets × 10 reps @ 80kg
- Completed: 3 sets × 12 reps @ 85kg
- RPE: 7

SYSTEM CALCULATES:
Volume prescribed = 80kg × 10 × 3 = 2,400 kg·reps
Volume completed = 85kg × 12 × 3 = 3,060 kg·reps
Difference = +660 kg·reps (27% more!)

DETECTION LOGIC:
if (completed_weight > prescribed_weight) {
  progression = "weight_increase" ✅
  feedback = "You went heavier! Great strength gain!"
}
else if (completed_reps > prescribed_reps) {
  progression = "reps_increase" ✅
  feedback = "You did more reps! Endurance improving!"
}
else if (completed_reps == prescribed_reps && rpe < 8) {
  progression = "easy"
  feedback = "This feels easy, try going heavier next time"
}
else if (rpe > 9) {
  progression = "very_hard"
  feedback = "That was tough, might be too heavy"
}
else {
  progression = "matched"
  feedback = "Good job hitting your target!"
}

RESULT: User sees clear feedback on progress
```

---

## 4. FEATURES LIST

### Core Features (MVP - Included)

#### 1. **User Authentication**
- Sign up with email/password
- Login with password verification
- Logout and session management
- Password hashing (bcrypt)
- JWT token-based authentication

#### 2. **Onboarding System**
- 6-step interactive setup
- Captures: Gender, age, height, weight, sport, fitness level, equipment, training days
- Progress bar with visual feedback
- Form validation
- Mobile-optimized

#### 3. **Intelligent Program Generation**
- Analyzes user parameters (sport, level, equipment)
- Calculates sport-specific muscle distribution
- Selects 10-12 exercises from 11,000+ database
- Creates 4-8 week periodization plan
- Progressive overload built-in
- Saves program to database

#### 4. **Daily Workout Display**
- Shows current week/intensity level
- Lists today's exercises with:
  - Exercise name
  - Target muscles
  - Prescribed sets/reps/weight
  - Exercise image/GIF
- Mobile-first responsive design
- Quick-start "🏃 Start Workout" button

#### 5. **Exercise Logging**
- Log sets, reps, weight with +/- buttons
- Rate difficulty (RPE 1-10)
- Add optional notes
- Real-time input validation
- GIF/image display for each exercise
- Shows prescribed vs actual performance

#### 6. **Progress Tracking**
- Personal records (PRs) for each exercise
- Progress charts over time
- Workout history
- Volume calculation (sets × reps × weight)
- Progression detection (weight up? reps up?)

#### 7. **Responsive Mobile UI**
- Mobile-first design
- Touch-friendly buttons
- Optimized for small screens
- Fast load times
- Smooth animations
- Bottom navigation

#### 8. **Muscle Group Intelligence**
- Sport-specific muscle priorities:
  - Skiing: 40% quads, 20% hamstrings, 15% glutes
  - Gym: 25% chest, 25% back, 15% legs, 15% shoulders
  - Kitesurfing: 25% core, 20% shoulders, 20% back
- Automatic exercise selection based on distribution

#### 9. **Progressive Overload System**
- Week 1-2: Light weight, focus on form (2×12)
- Week 3-5: Moderate weight, strength (3×10)
- Week 6-7: Heavy weight, max strength (4×6)
- Week 8: Light recovery week (2×15)
- Automatically adjusts based on fitness level

#### 10. **Data Persistence**
- All workouts saved to database
- All exercise logs stored
- All progress tracked
- Can view workout history anytime

---

### Future Features (Post-MVP)

- **Tamagotchi Gamification** (killer feature!)
  - Virtual pet that needs attention
  - Daily milestones (exercise, nutrition, sleep, cold training)
  - Achievements & streaks
  - Coins & cosmetic rewards

- **Nutrition Tracking**
  - Log meals
  - Macro tracking (protein, carbs, fats)
  - Daily targets

- **Advanced Analytics**
  - Muscle balance detection
  - Volume progression charts
  - Workout history detailed analysis
  - Recommendations for next week

- **Social Features**
  - Share progress
  - Community leaderboards
  - Follow other users
  - Comment on workouts

- **Cold Training Module**
  - Log cold showers
  - Log ice baths
  - Track duration/temperature
  - Integration with tamagotchi

- **Mobile App**
  - iOS via Capacitor
  - Android via Capacitor
  - App Store/Play Store submission

---

## 5. USER INSTRUCTIONS

### Getting Started (5 minutes)

**STEP 1: Create Account**
1. Open http://localhost:3000
2. Click "Sign Up" button
3. Enter your name, email, password
4. Click "Sign Up"
→ You're logged in!

**STEP 2: Complete Onboarding (6 steps)**
1. Select your gender
2. Enter your age
3. Enter your height (cm) and weight (kg)
4. Select your sport (Skiing, Snowboarding, Gym, Kitesurfing)
5. Select your fitness level (Beginner, Intermediate, Advanced)
6. Select available equipment (checkboxes)
7. Select days per week (3-6) and session duration (30-90 min)
8. Click "Create Program"
→ Your personalized 8-week program is ready!

**STEP 3: Start Your First Workout**
1. You're now on the Home screen
2. You see "Week 1 • RAMP-UP" (light week for form)
3. See 4 exercises listed
4. Click "🏃 Start Workout"
5. See first exercise with:
   - Exercise name
   - GIF showing how to do it
   - Prescribed: 2 sets × 12 reps @ 20kg
6. Adjust your actual performance:
   - Sets: Click +/- to match what you did
   - Reps: Click +/- to match what you did
   - Weight: Type or use +/- 2.5kg buttons
   - RPE: Click 1-10 to rate difficulty
7. Optionally add notes (e.g., "felt good")
8. Click "✅ Log & Next"
9. Repeat for exercise 2, 3, 4
10. See "Workout Complete! 🎉"
→ Your workout is saved!

**STEP 4: Check Your Progress**
1. Click "Progress" in navigation
2. See charts showing your strength over time
3. See personal records (PR) for each exercise
4. Example: "Barbell Squat PR: 90kg 🏆"

---

### Advanced Usage

#### How to Use Exercise Adjustments

**+/- Buttons:**
- **Sets:** Usually stay same as prescribed (2-4)
- **Reps:** Go higher if easy, lower if very hard
- **Weight:** Go higher if easy, lower if too heavy

**RPE (Rate of Perceived Exertion):**
- 1-3: Very easy (could do 10 more reps)
- 4-6: Easy (could do 5 more reps)
- 7-8: Challenging (1-2 more reps left)
- 9-10: Maximum effort (can't do more)

**Good vs Bad Progression:**
- ✅ Good: 80kg → 85kg (same reps)
- ✅ Good: 80kg 10 reps → 80kg 12 reps
- ✅ Good: Both weight AND reps go up
- ❌ Bad: Weight goes down, reps go down
- ❌ Bad: RPE is always 10 (likely too heavy)

#### Reading Your Program

**Week Structure:**
```
Week 1-2: 🔴 RAMP-UP (light, form focused)
Week 3-5: 🟡 BUILD (moderate, strength focused)
Week 6-7: 🔥 PEAK (heavy, max strength)
Week 8: 💚 DELOAD (light, recovery)
```

**What to Expect:**
- Week 1 feels easy → This is correct, build foundation
- Week 3 feels harder → Yes, weight is increasing
- Week 6-7 feels very hard → Yes, peak intensity
- Week 8 feels light → Yes, recovery week before next cycle

#### Understanding Your Progress

**Personal Records (PRs):**
- Shows the heaviest weight you've lifted for each exercise
- Example: "Barbell Squat PR: 95kg"
- This is your strength baseline

**Progress Charts:**
- X-axis: Time (weeks 1-8)
- Y-axis: Weight lifted (kg)
- Shows your strength curve
- You should see it trending UP (good!)

**Volume:**
- Sets × Reps × Weight = Total Volume
- Example: 3 sets × 10 reps × 80kg = 2,400 kg·reps
- More volume = more progress
- Should increase each week (by changing weight or reps)

---

## 6. TECHNICAL ARCHITECTURE

### Technology Stack

**Frontend:**
- Nuxt 4 (Vue 3 framework)
- TypeScript for type safety
- Tailwind CSS for styling
- Pinia for state management
- Motion.js for smooth animations

**Backend:**
- Node.js runtime
- Express.js web framework
- TypeORM for database ORM
- MySQL database
- JWT for authentication

**External APIs:**
- ExerciseDB (11,000+ exercises with GIFs)

**Deployment:**
- Frontend: Vercel (serverless)
- Backend: DigitalOcean (VPS)
- Database: DigitalOcean MySQL

### Database Structure

**users table:**
Stores user account data

**exercises table:**
Stores 11,000+ exercises with:
- Name, description
- Target muscles
- Difficulty level
- Required equipment
- GIF URL
- Instructions

**workout_programs table:**
Stores generated programs with:
- User ID (which user owns it)
- Sport, fitness level, goal
- 8-week structure
- Muscle distribution

**workout_logs table:**
Stores each completed workout with:
- Which exercises were done
- Total duration
- Difficulty rating
- Date/time

**exercise_logs table:**
Stores each individual exercise with:
- Sets, reps, weight completed
- Sets, reps, weight prescribed
- RPE rating
- Notes
- Date/time

---

## 7. FAQ

### **Q: Why 8 weeks?**
**A:** Research shows 8 weeks is optimal for:
- Muscle adaptation
- Strength plateau before deload
- Motivation before program reset
- Allows 4 full cycles per year

### **Q: Can I change the program?**
**A:** Not yet (MVP), but planned for future:
- Swap exercises manually
- Adjust exercises per week
- Create custom programs

### **Q: What if I miss a day?**
**A:** Just pick up where you left off. The app doesn't track "missed days" - only "completed days". You can do it whenever you want.

### **Q: Can I repeat the same program?**
**A:** After week 8 ends, you can generate a new one with same parameters. The exercises will rotate to prevent boredom.

### **Q: How accurate is the exercise library?**
**A:** ExerciseDB is professionally curated with:
- GIFs from professional athletes
- Proper form demonstrations
- Anatomically correct muscle targeting

### **Q: Can I work out with friends?**
**A:** Not yet (MVP). Future versions will have:
- Social sharing
- Leaderboards
- Group challenges

### **Q: Is my data private?**
**A:** Yes:
- Passwords are hashed (bcrypt)
- Data encrypted in transit (HTTPS)
- Only you can see your workouts
- No sharing by default

### **Q: Can I export my data?**
**A:** Not yet (MVP), but planned for future.

### **Q: What if I get injured?**
**A:** Switch to "recovery" goal when creating next program:
- Lighter weights
- Higher reps (15+)
- Fewer sets
- Focus on mobility

### **Q: Can I use this offline?**
**A:** Not yet. Requires internet connection for:
- Exercise library sync
- Program generation
- Saving workouts

---

## GETTING HELP

### Common Issues

**Q: White screen on load**
**A:** Clear browser cache (Ctrl+Shift+Delete), refresh page

**Q: Exercise won't log**
**A:** Check internet connection, try refreshing page

**Q: Forgot password**
**A:** Not yet implemented (MVP). Create new account

### Contact

For bugs or feature requests:
1. Note the issue (screen, what happened)
2. Try refreshing page
3. If still broken, email support

---

## CONCLUSION

Fitness MVP is designed to be simple yet powerful:
- **Simple:** 6-step onboarding, one workout per day
- **Powerful:** 11K exercises, intelligent periodization, progress tracking

**Start your first workout today.** Your future self will thank you! 💪

---

**Document End**

---

### How to Convert to PDF:

**Option 1: Browser Print (Recommended)**
1. Copy this entire document
2. Paste into Google Docs or Word
3. File → Download → PDF

**Option 2: Direct Print**
1. Open this document
2. Ctrl+P (or Cmd+P on Mac)
3. Save as PDF

**File naming:** `Fitness_MVP_Guide.pdf`