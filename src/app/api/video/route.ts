import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// Define the path to the JSON file
const dataFilePath = path.join(process.cwd(), 'src', 'data', 'video.json');

// Ensure the data directory and file exist
async function ensureDataFile() {
  try {
    await fs.access(dataFilePath);
  } catch (error) {
    // File doesn't exist, create it with default content
    await fs.mkdir(path.dirname(dataFilePath), { recursive: true });
    await fs.writeFile(dataFilePath, JSON.stringify({ 
      url: "https://www.youtube.com/watch?v=zWMj0Vu-z2I", 
      title: "KISAH PILU MENGERIKAN DI KARNAVAL.... EMOTIONLESS : The Last Ticket" 
    }));
  }
}

export async function GET() {
  await ensureDataFile();
  try {
    const fileContents = await fs.readFile(dataFilePath, 'utf8');
    const data = JSON.parse(fileContents);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ message: 'Error reading video data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  await ensureDataFile();
  try {
    const body = await request.json();
    const { url, title } = body;

    if (!url || !title) {
      return NextResponse.json({ message: 'URL and title are required' }, { status: 400 });
    }
    
    // Read the current data, just in case
    const fileContents = await fs.readFile(dataFilePath, 'utf8');
    const data = JSON.parse(fileContents);

    // Update with new data
    data.url = url;
    data.title = title;

    await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2));

    return NextResponse.json({ message: 'Video updated successfully' });
  } catch (error) {
    return NextResponse.json({ message: 'Error saving video data' }, { status: 500 });
  }
}
