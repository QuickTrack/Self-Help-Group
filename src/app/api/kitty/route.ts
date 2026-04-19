import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/server/utils/db';
import { Kitty, Meeting, FinancialSettings } from '@/lib/server/models';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const meetingId = searchParams.get('meetingId');
    
    const query = meetingId ? { meetingId } : {};
    const kities = await Kitty.find(query).sort({ createdAt: -1 }).lean();
    
    return NextResponse.json({ kities });
  } catch (error) {
    console.error('Error fetching kitty:', error);
    return NextResponse.json({ error: 'Failed to fetch kitty' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { meetingId, memberId, memberName, memberIdStr, totalContribution, amountPaid } = body;
    
    if (!meetingId || !memberId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Fetch meeting budget from FinancialSettings
    const finSettings = await FinancialSettings.findOne() as any;
    const meetingBudget = finSettings?.meetingBudget || 200;
    
    // Find or create kitty for this meeting
    let kitty = await Kitty.findOne({ meetingId });
    
    if (!kitty) {
      kitty = await Kitty.create({
        meetingId,
        meetingDate: new Date(),
        totalCollected: 0,
        memberCount: 0,
        meetingBudget,
        contributions: [],
      });
    }
    
    // Add contribution to kitty
    const contributionEntry = {
      member: memberId,
      memberName: memberName || '',
      memberId: memberIdStr || '',
      totalContribution: totalContribution || 0,
      amountPaid: meetingBudget, // Always use meeting budget from settings
      paidAt: new Date(),
    };
    
    // Check if member already has entry
    const existingIndex = kitty.contributions.findIndex(
      (c: any) => c.member?.toString() === memberId || c.memberId === memberIdStr
    );
    
    if (existingIndex >= 0) {
      // Update existing
      kitty.contributions[existingIndex] = contributionEntry;
    } else {
      // Add new
      kitty.contributions.push(contributionEntry);
      kitty.memberCount = kitty.contributions.length;
    }
    
    // Calculate total: member count × meeting budget from settings
    kitty.totalCollected = kitty.memberCount * meetingBudget;
    kitty.meetingBudget = meetingBudget;
    
    await kitty.save();
    
    return NextResponse.json({ kitty }, { status: 201 });
  } catch (error) {
    console.error('Error saving to kitty:', error);
    return NextResponse.json({ error: 'Failed to save to kitty' }, { status: 500 });
  }
}