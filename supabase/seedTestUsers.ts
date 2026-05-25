import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: './Backend/.env' })

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const AVATAR_COLORS = [
  { bg: '#EEF2FF', text: '#3730A3' },
  { bg: '#F0FDF4', text: '#166534' },
  { bg: '#FDF4FF', text: '#7E22CE' },
  { bg: '#FFF7ED', text: '#9A3412' },
  { bg: '#E6F1FB', text: '#0C447C' },
  { bg: '#EAF3DE', text: '#27500A' },
  { bg: '#FAEEDA', text: '#633806' },
  { bg: '#FAECE7', text: '#712B13' },
  { bg: '#EEEDFE', text: '#3C3489' },
  { bg: '#E1F5EE', text: '#085041' },
]

const TEST_USERS = Array.from({ length: 10 }, (_, i) => ({
  email:        `test${i + 1}@gmail.com`,
  password:     '123456789',
  display_name: `Test User ${i + 1}`,
  username:     `test${i + 1}`,
  bio:          `Hi, I am test${i + 1}. Testing Nexera chat.`,
  status:       i % 3 === 0 ? 'away' : 'online',
  initials:     `T${i + 1}`,
  avatar_color_bg:   AVATAR_COLORS[i].bg,
  avatar_color_text: AVATAR_COLORS[i].text,
}))

async function seedTestUsers() {
  console.log('Creating 10 test users...\n')

  for (const user of TEST_USERS) {
    // 1. Check if user already exists — skip if so
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', user.username)
      .single()

    if (existing) {
      console.log(`SKIP  ${user.username} already exists`)
      continue
    }

    // 2. Create in Supabase Auth
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email:          user.email,
      password:       user.password,
      email_confirm:  true,
      user_metadata:  { display_name: user.display_name },
    })

    if (authErr) {
      console.error(`ERROR ${user.username}: ${authErr.message}`)
      continue
    }

    const userId = authData.user.id

    // 3. Upsert into public.profiles
    const { error: profileErr } = await supabase.from('profiles').upsert({
      id:                userId,
      display_name:      user.display_name,
      username:          user.username,
      bio:               user.bio,
      status:            user.status,
      initials:          user.initials,
      avatar_color_bg:   user.avatar_color_bg,
      avatar_color_text: user.avatar_color_text,
      avatar_url:        null,
      created_at:        new Date().toISOString(),
      updated_at:        new Date().toISOString(),
    })

    if (profileErr) {
      console.error(`PROFILE ERROR ${user.username}: ${profileErr.message}`)
      continue
    }

    // 4. Add to workspace (get the first workspace — or create one if none)
    const { data: ws } = await supabase
      .from('workspaces')
      .select('id')
      .limit(1)
      .single()

    if (ws) {
      await supabase.from('workspace_members').upsert({
        workspace_id: ws.id,
        user_id:      userId,
        role:         'member',
      })
    }

    console.log(`OK    ${user.username} | ${user.email} | id: ${userId}`)
  }

  console.log('\nDone! All test users created.')
  console.log('Login with any of: test1@gmail.com ... test10@gmail.com')
  console.log('Password for all: 123456789')
}

seedTestUsers().catch(console.error)
