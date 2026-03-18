# Code Classroom

A real-time collaborative code classroom built with Next.js and Socket.IO. Teachers can create rooms and write HTML, CSS, and JavaScript code, while students can join and see updates in real-time.

## Features

- **Real-time Collaboration**: Teacher code changes are instantly synced to all students
- **No Database**: Everything runs in-memory - rooms are lost when server restarts
- **Room-based System**: 6-character room codes for easy joining
- **Role-based Access**: Teachers can edit, students are read-only
- **Live Preview**: Code renders in real-time using iframe
- **Monaco Editor**: Full-featured code editor with syntax highlighting

## Tech Stack

- Next.js 15 (App Router)
- React 19
- TypeScript
- Socket.IO
- Monaco Editor
- Tailwind CSS
- shadcn/ui

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd my-app
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

### Deploy to Vercel

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel --prod
```

Or push to a Git repository and import it on the Vercel dashboard.

## How It Works

### Room Creation (Teacher)
1. Teacher selects "I'm a Teacher" on the homepage
2. Clicks "Create New Room"
3. Gets redirected to room with a unique 6-digit code
4. Can edit HTML, CSS, and JS in the Monaco editor
5. Changes are auto-synced to all connected students

### Room Joining (Student)
1. Student selects "I'm a Student" on the homepage
2. Enters the 6-digit room code
3. Gets redirected to the room as a read-only viewer
4. Sees real-time code updates from the teacher
5. Cannot edit the code

### Socket Events
- `room:create` - Teacher creates a room
- `room:join` - Student joins a room
- `room:state` - Server sends current code state
- `code:update` - Teacher updates code
- `code:sync` - Server broadcasts code to students
- `room:closed` - Teacher disconnects, room closes

## Architecture

```
my-app/
├── app/
│   ├── api/socket/route.ts    # Socket.IO server
│   ├── room/[code]/page.tsx   # Room page
│   ├── page.tsx               # Home page
│   ├── layout.tsx             # Root layout
│   └── globals.css            # Global styles
├── components/
│   └── ui/                    # shadcn/ui components
├── lib/
│   ├── socket.ts              # Socket.IO client
│   └── utils.ts               # Utility functions
├── server.ts                  # Custom Next.js server with Socket.IO
├── next.config.ts             # Next.js configuration
├── package.json               # Dependencies
└── README.md                  # Documentation
```

## License

MIT License - feel free to use this project for your own purposes.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

If you found this project helpful, please give it a star on GitHub!
