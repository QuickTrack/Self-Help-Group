import { NextResponse } from 'next/server';
import { WelfarePayout, WelfareFund, Member, EligibilitySettings, initializeEligibilitySettings } from '@/lib/server/models';
import dbConnect from '@/lib/server/utils/db';

async function getSettings() {
  await initializeEligibilitySettings();
  const settings = await EligibilitySettings.find({}).lean();
  return settings.reduce((acc: Record<string, any>, s: any) => {
    acc[s.key] = s.value;
    return acc;
  }, {});
}

export async function GET(request: Request) {
  try {
    await dbConnect();
    const settings = await getSettings();
    
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');
    const eventType = searchParams.get('eventType');
    const requestedAmount = parseInt(searchParams.get('amount') || '0');
    
    if (!memberId || !eventType || !requestedAmount) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }
    
    const member = await Member.findById(memberId);
    if (!member) {
      return NextResponse.json({ isEligible: false, reasons: ['Member not found'] });
    }
    
    const welfareContributions = await WelfareFund.find({ member: memberId });
    const totalContributed = welfareContributions.reduce((sum, c) => sum + c.amount, 0);
    
    const minimumContributionMonths = settings.minimumContributionMonths || 3;
    const recentContributions = await WelfareFund.countDocuments({
      member: memberId,
      date: { $gte: new Date(Date.now() - minimumContributionMonths * 30 * 24 * 60 * 60 * 1000) }
    });
    
    const joinDate = new Date(member.joinDate);
    const monthsActive = Math.floor((Date.now() - joinDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
    
    const limitKey = `limit${eventType}`;
    const maxLimit = settings[limitKey] || 10000;
    
    const reasons: string[] = [];
    if (settings.requireActiveStatus && member.status !== 'active') {
      reasons.push('Member is not active');
    }
    if (totalContributed < (settings.minimumContributionsAmount || 750)) {
      reasons.push(`Total contributions (${totalContributed}) below minimum (${settings.minimumContributionsAmount || 750})`);
    }
    if (recentContributions < (settings.minimumContributionMonths || 3)) {
      reasons.push(`Contributions in last ${settings.minimumContributionMonths || 3} months (${recentContributions}) below minimum (${settings.minimumContributionMonths || 3})`);
    }
    if (monthsActive < (settings.minimumMembershipMonths || 3)) {
      reasons.push(`Membership period (${monthsActive} months) below minimum (${settings.minimumMembershipMonths || 3})`);
    }
    if (requestedAmount > maxLimit) {
      reasons.push(`Amount exceeds ${eventType} limit (${maxLimit})`);
    }
    
    return NextResponse.json({
      member: {
        _id: member._id,
        memberId: member.memberId,
        fullName: member.fullName,
        status: member.status,
        joinDate: member.joinDate,
        monthsActive,
      },
      eligibility: {
        isEligible: reasons.length === 0,
        totalContributed,
        recentContributions,
        monthsActive,
        maxLimit,
        reasons,
        checkedAt: new Date(),
      },
      settings: {
        minimumContributionMonths: settings.minimumContributionMonths,
        minimumContributionsAmount: settings.minimumContributionsAmount,
        minimumMembershipMonths: settings.minimumMembershipMonths,
      },
    });
  } catch (error) {
    console.error('Eligibility check error:', error);
    return NextResponse.json({ error: 'Failed to check eligibility' }, { status: 500 });
  }
}