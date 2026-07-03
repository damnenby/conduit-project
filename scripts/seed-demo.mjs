const API_URL = process.env.CONDUIT_API_URL ?? 'http://localhost:3000/api'
const DEMO_PASSWORD = process.env.CONDUIT_DEMO_PASSWORD ?? 'Conduit2026!'

const users = [
  {
    username: 'defense_demo',
    email: 'defense.demo@conduit.test',
    bio: 'Community host collecting practical stories from the Conduit community.',
  },
  {
    username: 'mara_dev',
    email: 'mara_dev@conduit.test',
    bio: 'Vue developer who likes small composables, readable code and good coffee.',
  },
  {
    username: 'jonas_backend',
    email: 'jonas_backend@conduit.test',
    bio: 'Backend student exploring NestJS, APIs and pragmatic architecture.',
  },
  {
    username: 'lina_design',
    email: 'lina_design@conduit.test',
    bio: 'Product designer focused on calm interfaces and useful details.',
  },
  {
    username: 'sofia_travels',
    email: 'sofia_travels@conduit.test',
    bio: 'Weekend traveler writing field notes from northern Germany and beyond.',
  },
  {
    username: 'tim_green',
    email: 'tim_green@conduit.test',
    bio: 'Trying sustainable habits that still work on busy weekdays.',
  },
  {
    username: 'anika_reads',
    email: 'anika_reads@conduit.test',
    bio: 'Reader, library regular and collector of marginal notes.',
  },
  {
    username: 'leo_music',
    email: 'leo_music@conduit.test',
    bio: 'Bedroom producer learning how to finish tracks instead of collecting loops.',
  },
  {
    username: 'nina_science',
    email: 'nina_science@conduit.test',
    bio: 'Science communicator turning small experiments into understandable stories.',
  },
  {
    username: 'paul_docker',
    email: 'paul_docker@conduit.test',
    bio: 'DevOps student interested in reproducible environments and boring reliability.',
  },
  {
    username: 'olga_cooks',
    email: 'olga_cooks@conduit.test',
    bio: 'Home cook sharing forgiving recipes for ordinary kitchens.',
  },
  {
    username: 'sam_access',
    email: 'sam_access@conduit.test',
    bio: 'Accessibility advocate testing websites with keyboard and screen reader.',
  },
  {
    username: 'emil_career',
    email: 'emil_career@conduit.test',
    bio: 'Career mentor helping students explain what they built and why.',
  },
  {
    username: 'katya_notes',
    email: 'katya_notes@conduit.test',
    bio: 'International student writing in English, Deutsch und manchmal по-русски.',
  },
  {
    username: 'noah_data',
    email: 'noah_data@conduit.test',
    bio: 'Database enthusiast who enjoys indexes, query plans and sensible defaults.',
  },
  {
    username: 'zara_security',
    email: 'zara_security@conduit.test',
    bio: 'Application-security student interested in auth boundaries and threat modeling.',
  },
]

const articles = [
  {
    author: 'defense_demo',
    title: 'Welcome to our busy little Conduit',
    description: 'A quick map of the people, topics and conversations you can find here.',
    body: `This demo community brings together developers, designers, travelers, cooks and curious students. Every profile has its own interests, but the useful conversations usually happen where those interests overlap.

Browse by tag, follow a few writers and try the personal feed. The data is intentionally varied so article lists, profiles, comments and favorites all feel like a living application during testing.`,
    tags: ['community', 'welcome', 'conduit'],
  },
  {
    author: 'defense_demo',
    title: 'How we keep community discussions useful',
    description: 'Four small habits that make comments worth reading.',
    body: `A useful comment adds a concrete example, asks a precise question or connects the article to another experience. Agreement is welcome, but context is even better.

We assume good intent, disagree with ideas rather than people, and leave room for beginners. Short, thoughtful comments beat long performances.`,
    tags: ['community', 'writing', 'discussion'],
  },
  {
    author: 'mara_dev',
    title: 'Vue composables that stay small',
    description: 'A practical rule for deciding what belongs in a composable.',
    body: `A composable earns its name when it hides a recurring piece of stateful behavior behind a small interface. Moving every ref into a separate file does not automatically improve a Vue application.

I start with code inside the view, wait for a real repetition, and then extract the smallest useful seam. The result is easier to explain and easier to test.`,
    tags: ['vue', 'typescript', 'frontend'],
  },
  {
    author: 'mara_dev',
    title: 'Debugging reactive state without guessing',
    description: 'A calm workflow for finding stale state and timing problems.',
    body: `When a Vue screen looks stale, first identify the source of truth. Is the value coming from a prop, a ref, a computed value or the server? Then inspect the transition that should have changed it.

Most bugs become ordinary once the state path is written down. Add one focused log or assertion, reproduce the transition and remove the diagnostic when the cause is clear.`,
    tags: ['vue', 'debugging', 'frontend'],
  },
  {
    author: 'jonas_backend',
    title: 'Why our NestJS guards stay boring',
    description: 'Authentication belongs at the route boundary; ownership needs database context.',
    body: `Our authentication guard has one job: read the Token header, verify the JWT and attach a user id. It does not decide whether that user owns a particular article.

Ownership checks stay in the service, where the article is already loaded. This separation makes the difference between 401 and 403 easy to explain in a defense.`,
    tags: ['nestjs', 'authentication', 'backend'],
  },
  {
    author: 'jonas_backend',
    title: 'Thin controllers and useful services',
    description: 'A student-friendly NestJS structure without enterprise ceremony.',
    body: `Controllers translate HTTP into method calls: route parameters, request bodies, status codes and guards. Services validate the input and perform the business operation.

That is enough structure for this project. Extra layers would add vocabulary without adding a real variation point, so we keep the module easy to navigate.`,
    tags: ['nestjs', 'architecture', 'typescript'],
  },
  {
    author: 'lina_design',
    title: 'Typography before decoration',
    description: 'Why hierarchy often fixes a page before shadows and color do.',
    body: `When a page feels unfinished, I first check the reading order. The title, supporting text, metadata and actions should have visibly different jobs.

A restrained type scale and consistent spacing create more confidence than decorative effects. Once hierarchy works, borders and color can stay quiet.`,
    tags: ['design', 'typography', 'ui'],
  },
  {
    author: 'lina_design',
    title: 'Empty states are part of the product',
    description: 'A blank feed still needs to explain what happens next.',
    body: `An empty state should name the situation and offer the next sensible action. “Nothing here” leaves the user with the same question they had before.

The best empty states are brief. Tell people why the area is empty, then give them one relevant path forward.`,
    tags: ['design', 'ux', 'content'],
  },
  {
    author: 'sofia_travels',
    title: 'A slow weekend on Rügen',
    description: 'Cliffs, quiet trains and why the off-season is worth considering.',
    body: `Rügen feels different when the beach cafés are quiet. I took the early regional train, walked above the chalk cliffs and kept enough time for an unplanned detour.

The useful lesson was simple: fewer stops made the trip feel longer. One good walk and one warm meal were enough for a memorable weekend.`,
    tags: ['travel', 'rügen', 'germany'],
  },
  {
    author: 'sofia_travels',
    title: 'Three calm cafés for a rainy Berlin day',
    description: 'Places where the coffee is good and nobody rushes your notebook.',
    body: `Rain changes the rhythm of Berlin. Instead of crossing the whole city, I chose one neighborhood and treated each café as a chapter in a small walking route.

My criteria are uncomplicated: comfortable light, a table that fits a notebook and music quiet enough for conversation.`,
    tags: ['travel', 'berlin', 'coffee'],
  },
  {
    author: 'tim_green',
    title: 'A low-waste kitchen that survives Monday',
    description: 'Sustainability works better when the routine is forgiving.',
    body: `The perfect zero-waste kitchen is not my goal. I want a few habits that still happen when work runs late: a visible leftovers shelf, one flexible soup recipe and containers that actually match.

Small systems reduce decisions. When the easy choice uses what is already there, less food ends up forgotten.`,
    tags: ['sustainability', 'food', 'habits'],
  },
  {
    author: 'tim_green',
    title: 'Cycling to work after the novelty fades',
    description: 'What made a good intention become an ordinary commute.',
    body: `Motivation got me through the first week. A reliable lock, dry socks and a route with fewer stressful intersections kept me cycling after that.

The best sustainable habit is often the one with the least friction. I improved the boring logistics instead of waiting to feel inspired.`,
    tags: ['sustainability', 'cycling', 'city'],
  },
  {
    author: 'anika_reads',
    title: 'The case for writing in the margins',
    description: 'Reading becomes a conversation when the book can answer back later.',
    body: `A penciled question records the exact moment a paragraph resisted me. Months later, the note is often more interesting than the sentence that triggered it.

Marginal notes do not need to be clever. A line, a question mark or a connection to another book is enough to preserve the reading experience.`,
    tags: ['books', 'reading', 'notes'],
  },
  {
    author: 'anika_reads',
    title: 'Building a reading habit without a quota',
    description: 'Consistency can be gentle and still produce a shelf of finished books.',
    body: `Page targets made reading feel like homework, so I replaced them with a location: the chair by the window is where my phone stays across the room and a book stays open.

Some sessions last five minutes. The habit survives because a short session still counts.`,
    tags: ['books', 'habits', 'learning'],
  },
  {
    author: 'leo_music',
    title: 'Finishing a track before starting another',
    description: 'A small definition of done rescued my folder of endless loops.',
    body: `I used to polish eight bars until they sounded expensive and then abandon them. Now I arrange the whole track with rough sounds before improving any section.

Completion reveals problems that looping hides. A finished imperfect arrangement teaches more than another beautiful intro.`,
    tags: ['music', 'production', 'workflow'],
  },
  {
    author: 'leo_music',
    title: 'Layer fewer synthesizers',
    description: 'Clear roles make a mix feel larger than another stack of presets.',
    body: `When every synthesizer fills the spectrum, none of them feels important. I ask each layer to own a role: movement, weight, texture or melody.

Muting a layer is often the fastest mix decision. Space gives the remaining sounds a reason to exist.`,
    tags: ['music', 'synthesizer', 'mixing'],
  },
  {
    author: 'nina_science',
    title: 'Citizen science starts with a repeatable note',
    description: 'Useful observation is less about expertise and more about consistency.',
    body: `A single observation becomes valuable when someone else can understand where, when and how it was made. The notebook is part of the instrument.

Record the boring context: weather, time, location and method. Patterns appear only when observations can be compared.`,
    tags: ['science', 'citizen-science', 'data'],
  },
  {
    author: 'nina_science',
    title: 'What a one-week sleep experiment can teach',
    description: 'A tiny personal experiment with modest conclusions.',
    body: `For one week I kept wake time fixed and recorded energy twice a day. The sample is too small for a universal claim, but large enough to notice my own late-evening pattern.

Personal experiments are useful when their limits stay visible. The result is a better question, not a medical verdict.`,
    tags: ['science', 'sleep', 'experiment'],
  },
  {
    author: 'paul_docker',
    title: 'Docker Compose as an executable README',
    description: 'One command can document infrastructure better than a page of guesses.',
    body: `A Compose file records ports, environment variables, service names, volumes and startup dependencies in one place. It turns “works on my machine” into something another machine can test.

The file still needs explanation, but it removes ambiguity from the first run. Reproducibility is a feature users notice immediately.`,
    tags: ['docker', 'devops', 'backend'],
  },
  {
    author: 'paul_docker',
    title: 'Health checks are not decoration',
    description: 'Started is not the same as ready.',
    body: `A process can exist before its migrations finish or before its network listener is useful. A health check gives dependent services a better signal than a fixed delay.

For a small project, a simple HTTP endpoint is enough. The important part is that it reflects a request the application can actually answer.`,
    tags: ['docker', 'healthcheck', 'infrastructure'],
  },
  {
    author: 'olga_cooks',
    title: 'A forgiving rye bread for cold mornings',
    description: 'A dense loaf with a schedule that does not demand perfection.',
    body: `This bread uses rye flour, warm water, salt and a little patience. The dough stays sticky, so resist the temptation to keep adding flour.

Let the loaf cool completely before slicing. The crumb settles as it rests, and the flavor is even better the next morning.`,
    tags: ['cooking', 'bread', 'recipe'],
  },
  {
    author: 'olga_cooks',
    title: 'Weekday soup from whatever is left',
    description: 'A method rather than a strict recipe.',
    body: `Start with an onion, add the vegetables that need attention, then choose one source of body: beans, potatoes, lentils or leftover grains.

Season in layers and keep acid for the end. A spoon of vinegar can make a tired pot taste awake again.`,
    tags: ['cooking', 'soup', 'low-waste'],
  },
  {
    author: 'sam_access',
    title: 'Keyboard testing in ten focused minutes',
    description: 'A fast manual pass catches barriers that screenshots cannot show.',
    body: `Put the mouse aside and move through the page with Tab, Shift+Tab, Enter and Space. Every interactive control should be reachable, understandable and visibly focused.

Pay special attention to dialogs and destructive actions. Focus must not disappear just when the decision becomes important.`,
    tags: ['accessibility', 'keyboard', 'testing'],
  },
  {
    author: 'sam_access',
    title: 'Accessible errors explain the next step',
    description: 'Color and a generic warning are not enough.',
    body: `An error should identify the problem close to the relevant action and suggest how to fix it. Dynamic feedback also needs a status or alert role so assistive technology notices the change.

Plain language helps everyone. “Email must be valid” is more useful than a validation code or internal exception.`,
    tags: ['accessibility', 'forms', 'ux'],
  },
  {
    author: 'emil_career',
    title: 'A junior portfolio needs decisions, not adjectives',
    description: 'Show what changed, why it mattered and how you checked it.',
    body: `“Modern” and “scalable” say little without context. A stronger portfolio explains the constraint, the choice and the consequence.

One carefully explained project can demonstrate more judgment than five screenshots with identical technology lists.`,
    tags: ['career', 'portfolio', 'students'],
  },
  {
    author: 'emil_career',
    title: 'Preparing for an oral project defense',
    description: 'Practice the reasoning chain, not a memorized speech.',
    body: `Start with the contract your system must satisfy. Then explain how the major building blocks collaborate and where important decisions live.

Expect follow-up questions about tradeoffs. A limitation you understand is easier to defend than complexity you cannot justify.`,
    tags: ['career', 'defense', 'architecture'],
  },
  {
    author: 'katya_notes',
    title: 'Study notes across three languages',
    description: 'Warum ein gemischtes Notizbuch manchmal besser funktioniert.',
    body: `I write the concept in the language used in class, add a short English explanation and keep Russian for the question I would ask myself later. The mixture is not elegant, but it preserves meaning.

Перед экзаменом я переписываю только связи между идеями. Translation becomes a test of understanding rather than a formatting task.`,
    tags: ['learning', 'languages', 'notes'],
  },
  {
    author: 'katya_notes',
    title: 'Remote study without losing the day',
    description: 'Маленькие границы между учебой, работой и отдыхом.',
    body: `When every activity happens at one desk, the day loses its edges. I start with a written task and end by closing every course tab.

Короткая прогулка после занятий работает как дорога домой. The ritual is small, but it tells the brain that study time has ended.`,
    tags: ['learning', 'remote', 'habits'],
  },
  {
    author: 'noah_data',
    title: 'SQLite indexes for questions you actually ask',
    description: 'Indexes should follow query patterns, not anxiety.',
    body: `An index speeds up a lookup by storing another ordered structure, and that structure costs space and write time. Add one when a real query needs it.

Use the query plan, measure representative data and keep the explanation close to the use case.`,
    tags: ['database', 'sqlite', 'performance'],
  },
  {
    author: 'noah_data',
    title: 'Pagination is part of the API contract',
    description: 'Limit, offset and total count shape both backend and interface behavior.',
    body: `The backend must define ordering before pagination has meaning. Without a stable order, the same offset can return surprising rows between requests.

The frontend needs the total count to know whether a next page exists. Small details become a shared contract across layers.`,
    tags: ['database', 'api', 'pagination'],
  },
  {
    author: 'zara_security',
    title: 'A practical mental model for JWT authentication',
    description: 'A signed token answers identity; it does not grant every action.',
    body: `The server signs a small claim and verifies it on later requests. That proves who presented a valid token, but authorization still depends on the requested resource.

Article ownership is a database fact. Keep that check where the article can be loaded and return 403 when identity is valid but permission is missing.`,
    tags: ['security', 'jwt', 'authentication'],
  },
  {
    author: 'zara_security',
    title: 'A small-project security review that stays useful',
    description: 'Focus on realistic failure paths before adding a large framework.',
    body: `Check password hashing, token validation, ownership, input handling, error leakage and committed secrets. Then exercise the negative paths with real requests.

Security work is strongest when it produces evidence. A focused 401 and 403 test is worth more than a long checklist nobody ran.`,
    tags: ['security', 'testing', 'backend'],
  },
]

const commentTemplates = [
  'This is a useful explanation. The concrete example made the tradeoff clear.',
  'I tried something similar last semester and the small routine mattered most.',
  'Good point. I would also be interested in a follow-up with more examples.',
  'The distinction in the second paragraph is easy to remember.',
  'This gave me a better question to take into my own project.',
  'I like that the limitation is stated instead of hidden.',
  'Short, practical and immediately useful — thanks for writing it.',
  'The “boring” part is usually what makes the system reliable.',
  'I had not connected these two ideas before. Nice perspective.',
  'Saving this for the next time I explain the project architecture.',
  'That final recommendation is the one I am going to test first.',
  'Clear writing. The article feels experienced without becoming complicated.',
]

const request = async (path, options = {}, expectedStatuses = [200]) => {
  const response = await fetch(`${API_URL}${path}`, options)
  const text = await response.text()
  const data = text ? JSON.parse(text) : null

  if (!expectedStatuses.includes(response.status)) {
    throw new Error(
      `${options.method ?? 'GET'} ${path} returned ${response.status}: ${text}`,
    )
  }

  return { status: response.status, data }
}

const jsonHeaders = (token) => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Token ${token}` } : {}),
})

const avatarUrl = (username) =>
  `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(username)}`

const ensureUser = async (user) => {
  const registration = await request(
    '/users',
    {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({
        user: {
          username: user.username,
          email: user.email,
          password: DEMO_PASSWORD,
        },
      }),
    },
    [201, 422],
  )

  let authenticatedUser = registration.data?.user

  if (registration.status === 422) {
    const login = await request(
      '/users/login',
      {
        method: 'POST',
        headers: jsonHeaders(),
        body: JSON.stringify({
          user: {
            email: user.email,
            password: DEMO_PASSWORD,
          },
        }),
      },
      [200],
    )
    authenticatedUser = login.data.user
  }

  const updated = await request(
    '/user',
    {
      method: 'PUT',
      headers: jsonHeaders(authenticatedUser.token),
      body: JSON.stringify({
        user: {
          bio: user.bio,
          image: avatarUrl(user.username),
        },
      }),
    },
    [200],
  )

  return updated.data.user
}

const main = async () => {
  const authenticatedUsers = new Map()

  for (const user of users) {
    const authenticated = await ensureUser(user)
    authenticatedUsers.set(user.username, authenticated)
  }

  let createdArticles = 0

  for (const article of articles) {
    const author = authenticatedUsers.get(article.author)
    const existing = await request(
      `/articles?author=${encodeURIComponent(article.author)}&limit=100`,
    )
    const alreadyExists = existing.data.articles.some(
      (candidate) => candidate.title === article.title,
    )

    if (alreadyExists) continue

    await request(
      '/articles',
      {
        method: 'POST',
        headers: jsonHeaders(author.token),
        body: JSON.stringify({
          article: {
            title: article.title,
            description: article.description,
            body: article.body,
            tagList: article.tags,
          },
        }),
      },
      [201],
    )
    createdArticles += 1
  }

  const allArticlesResponse = await request('/articles?limit=200')
  const allArticles = allArticlesResponse.data.articles
  let followsCreated = 0
  let favoritesCreated = 0
  let commentsCreated = 0

  for (let userIndex = 0; userIndex < users.length; userIndex += 1) {
    const user = users[userIndex]
    const authenticated = authenticatedUsers.get(user.username)

    for (let offset = 1; offset <= 4; offset += 1) {
      const target = users[(userIndex + offset) % users.length]
      await request(
        `/profiles/${encodeURIComponent(target.username)}/follow`,
        {
          method: 'POST',
          headers: jsonHeaders(authenticated.token),
        },
        [200],
      )
      followsCreated += 1
    }

    for (let offset = 0; offset < 6; offset += 1) {
      const article = allArticles[(userIndex * 3 + offset * 5) % allArticles.length]
      await request(
        `/articles/${encodeURIComponent(article.slug)}/favorite`,
        {
          method: 'POST',
          headers: jsonHeaders(authenticated.token),
        },
        [200],
      )
      favoritesCreated += 1
    }
  }

  for (let articleIndex = 0; articleIndex < allArticles.length; articleIndex += 1) {
    const article = allArticles[articleIndex]
    const existingComments = await request(
      `/articles/${encodeURIComponent(article.slug)}/comments`,
    )

    for (let commentOffset = 1; commentOffset <= 3; commentOffset += 1) {
      const commenter = users[(articleIndex + commentOffset * 3) % users.length]
      const authenticated = authenticatedUsers.get(commenter.username)
      const body =
        commentTemplates[(articleIndex * 2 + commentOffset) % commentTemplates.length]
      const alreadyExists = existingComments.data.comments.some(
        (comment) =>
          comment.author.username === commenter.username && comment.body === body,
      )

      if (alreadyExists) continue

      await request(
        `/articles/${encodeURIComponent(article.slug)}/comments`,
        {
          method: 'POST',
          headers: jsonHeaders(authenticated.token),
          body: JSON.stringify({ comment: { body } }),
        },
        [201],
      )
      commentsCreated += 1
    }
  }

  const tags = await request('/tags')
  const finalArticles = await request('/articles?limit=200')

  console.log(
    JSON.stringify(
      {
        users: authenticatedUsers.size,
        articles: finalArticles.data.articlesCount,
        articlesCreatedThisRun: createdArticles,
        followsEnsured: followsCreated,
        favoritesEnsured: favoritesCreated,
        commentsCreatedThisRun: commentsCreated,
        tags: tags.data.tags.length,
      },
      null,
      2,
    ),
  )
}

await main()
