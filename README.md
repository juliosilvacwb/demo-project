# Better Bookkeeping Demo App

A simple workout tracking app built with TanStack Start. Users can configure movements (e.g. bench-press, dumbbell curls), create workouts with sets, and view their workout history.

## Feature Requests

1. Add weight tracking section where a user can input their weight. This should be something they can track over time. Add a chart showing the history of that
   - **Implementation**: Built using TanStack Start’s SSR architecture and Recharts.
   - **Why Recharts?**: I chose Recharts because it is a native React library based on declarative SVG components, allowing for performant and responsive integration with the project’s ecosystem in a single unified solution.

2. The current setup doesn't support body-weight movements very well (e.g. pullups / pushups) update the "movements page" so a user can flag a movement as "body-weight" when they create it. When a "body-weight" movement is added to the current workout the weight field should default to the most recent user-inputted weight
   - **Implementation**: Added an `isBodyWeight` flag to the `Movement` model and integrated automated weight pre-filling. I used TanStack Query's `invalidateQueries` to ensure the most recent body weight log is immediately available to the workout workout entry form.
   - **Why TanStack Query Cache?**: I chose to leverage TanStack Query's cache system to manage cross-feature data synchronization (Body Metrics -> Current Workout). This avoids manual prop-drilling or complex global state, providing a performant, reactive experience where weight logs are instantly reflected in exercise fields.

3. The Workout history should give the user a sense of progression. One way to do this is to show certain summary metrics for each movement and their progression over time. Please implement a chart where a user can select a movement and a corresponding metric and see that metric plotted against time.
   Metrics:
   - maximum weight (the maximum weight for that movement on a given day)
   - total reps
   - total volume (volume of a set is weight \* reps, total volume for a movement is total volume of all sets in a workout)
   - **Implementation**: Developed a server-side aggregation function `getMovementHistoryStatsServerFn` that calculates metrics (max weight, total reps, and volume) per workout date using optimized Raw SQL. This data is visualized via a custom `WorkoutProgressionChart` built with Recharts, featuring dynamic movement and metric selection.
   - **Why Raw SQL Aggregations?**: I opted for `$queryRaw` because it's the most efficient method for calculating metrics like total volume and maximums across potentially thousands of sets. By offloading these calculations to PostgreSQL, I ensured minimal data transfer and kept the UI reactive, regardless of the size of the user's training history.

4. There are no tests! Please implement the e2e tests in the `e2e/` directory using Playwright. The test scaffolding is already set up - you just need to implement the test cases:
   - `e2e/movements.spec.ts` - Movement CRUD operations
   - `e2e/sets.spec.ts` - Set CRUD operations
   - `e2e/workouts.spec.ts` - Workout CRUD operations
   - **Implementation**: I completed this task and implemented the full suite of end-to-end tests. Beyond the requested scripts, I added `e2e/auth.spec.ts` and `e2e/body-metrics.spec.ts` to ensure coverage for authentication and body weight tracking.

5. **Security Fix**: The authentication system stores passwords in plaintext. Please implement proper password hashing using a secure algorithm (e.g., bcrypt, argon2). Update the sign-up and sign-in flows accordingly.
   - **Implementation**: I implemented the `argon2` hashing algorithm for both registration and login.
   - **Why Argon2?**: I chose Argon2id because it is the winner of the Password Hashing Competition (PHC) and offers superior resistance to brute-force attacks using GPUs and specialized hardware (ASIC), as it scales better with memory and CPU usage.

### Stretch Goals

- Get creative - how would you add nutrition tracking to this app? Macros (Carb / Protein / Fats) and Calories & Calorie surplus/deficit

> **Nutrition & Recovery Tracking:** Implementation of a performance-focused nutritional support module, allowing simplified logging of macronutrients (Proteins, Carbs, and Fats) and total calories. The key differentiator is the direct correlation with workout history: the system calculates dynamic protein targets based on user weight and lifted volume, signaling muscle recovery status (Surplus/Deficit) and providing insights on how nutrition is driving strength progression across monitored movements.

- Database design / performance upgrade - let us know what we're doing wrong. Show us how you would tackle harder problems like admin boards to summarize users in the system.
  
> **Time-Ordered Indexing & Write Performance:** To prevent index fragmentation and write performance degradation in high-scale databases, I propose replacing random UUIDs with UUIDv7. This change ensures that records are stored chronologically at the disk level, drastically optimizing time-based queries (such as the progression charts) and allowing for massive data insertion without the constant overhead of index reordering.

> **Admin Dashboard & Aggregation Strategy:** The challenge of generating real-time global summaries (such as total training volume or active users) for an administrative panel will be solved using Materialized Views and pre-computation via Background Jobs (Cron). Instead of performing expensive scans across millions of rows every time an admin accesses the dashboard, the system will read pre-calculated summary tables, ensuring sub-second dashboard performance and eliminating the risk of locking the database for end-users during analytical queries.

> **Data Precision & Professional Standards:** To meet the requirements of professional athletes who use fractional increments, the data architecture will be updated to support high-precision data types (such as Decimal or Float) for weight fields. This resolves the current limitation of integer-only values, allowing for the precise tracking of subtle progressions (e.g., 1.25kg or 2.5lb) and ensuring that total volume calculations and 1RM (One-Rep Max) metrics accurately reflect the user's actual performance.

- Security audit / improvement - beyond password hashing, what other security improvements would you make? Consider things like rate limiting, CSRF protection, or session management

> **Insecure Fallback Session Secret: [SOLVED]** I implemented a security safeguard that prevents the application from starting without a session secret in production or staging environments, mitigating the risk of vulnerabilities caused by default configurations or oversights.

> **Missing Authentication System: [SOLVED]** Implemented and integrated `authMiddleware` across all authenticated server functions in the application, ensuring session-based security for all protected operations.
>
> **Credential Leak via Public Config: [SOLVED]** Refactored `getServerConfigServerFn` to return only safe environment data, preventing the exposure of `database.url` and `sessionSecret` (cookie signature) to the client. Updated `db.server.ts` to access `configService` directly on the server to maintain secure database access.

> **Scoped Ownership & Data Integrity:** To resolve IDOR vulnerabilities and data duplication, I suggest implementing a scope-based permission system (Global vs. User-owned). Standard movements are flagged as isGlobal and protected from editing or deletion by regular users, while custom exercises include an ownerId, ensuring that a user can never access or remove another's data. This architecture allows the PO to maintain a curated, official library while offering users the flexibility to expand their own database in an isolated and secure manner, utilizing composite Unique Constraints to prevent redundancies within the same scope.

> **Lack of Rate Limiting on Auth Endpoints:** Implement a rate-limiting middleware using a sliding window or token bucket algorithm (e.g., using `upstash/ratelimit` or a local Redis/Memory store).

- General UI cleanup / update - the UI here is totally basic. Show us some improvements you'd make to make this app look clean and professional

> **Modular Component Architecture:** Transformation of monolithic page-level components into a fragmented, highly-reusable React architecture. By decoupling business logic through Custom Hooks and isolating UI patterns into atomic components, we ensure a scalable codebase that minimizes side-effect risks and drastically improves unit testing coverage. This approach turns each 'page' into an orchestration layer, rather than a logic dump, resulting in a cleaner development experience and faster UI iterations.

There will be a code review on what you write! So be prepared to explain how and why you implemented these features.

Please use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/#summary) as you're working on this repo.

## Tech Stack

- **Framework**: TanStack Start (React SSR)
- **Router**: TanStack Router (file-based routing)
- **State Management**: TanStack Query + TanStack Form
- **Database**: PostgreSQL + Prisma
- **Styling**: Tailwind CSS v4
- **Runtime**: Bun
- **Testing**: Playwright (e2e)

## Development

### Prerequisites

- Bun runtime installed
- Docker (for PostgreSQL)

### Getting Started

```bash
# Install dependencies
bun install

# Start development server with Docker (includes PostgreSQL)
bun run dev

# Stop services
bun run dev:down
```

### Available Scripts

- `bun run dev` - Start development server with Docker
- `bun run dev:down` - Stop Docker services
- `bun run build` - Build for production
- `bun run test` - Run e2e tests with Playwright
- `bun run test:ui` - Run e2e tests with Playwright UI
- `bun run typecheck` - Run TypeScript type checking
- `bun run db:migrate` - Run database migrations

## Project Structure

```
src/
├── routes/           # File-based routing
├── components/       # Reusable components
└── lib/              # Business logic & server functions
prisma/
├── schema.prisma     # Database schema
└── migrations/       # Database migrations
```
