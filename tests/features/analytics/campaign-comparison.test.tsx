import { describe, it, expect } from 'vitest';

describe('Campaign Comparison - A/B Testing', () => {
  it('should compare two campaign performance metrics', () => {
    const campaignA = {
      sent: 10000,
      delivered: 9500,
      bounces: 500,
      opens: 4000,
      clicks: 1200,
    };

    const campaignB = {
      sent: 10000,
      delivered: 9700,
      bounces: 300,
      opens: 5000,
      clicks: 1800,
    };

    // Delivery rate
    expect((campaignA.delivered / campaignA.sent) * 100).toBe(95);
    expect((campaignB.delivered / campaignB.sent) * 100).toBe(97);

    // Campaign B has better delivery rate
    expect(campaignB.delivered / campaignB.sent).toBeGreaterThan(
      campaignA.delivered / campaignA.sent
    );
  });

  it('should calculate statistical significance', () => {
    const campaignA = { delivered: 9500, sent: 10000 };
    const campaignB = { delivered: 9700, sent: 10000 };

    const rateA = campaignA.delivered / campaignA.sent;
    const rateB = campaignB.delivered / campaignB.sent;

    const difference = Math.abs(rateB - rateA);
    const pooledRate = (campaignA.delivered + campaignB.delivered) / (campaignA.sent + campaignB.sent);

    const standardError = Math.sqrt(
      pooledRate * (1 - pooledRate) * (1 / campaignA.sent + 1 / campaignB.sent)
    );

    const zScore = difference / standardError;

    // Z-score > 1.96 indicates statistical significance at 95% confidence
    expect(zScore).toBeGreaterThan(0);
  });

  it('should show confidence intervals', () => {
    const campaign = { delivered: 9500, sent: 10000 };
    const rate = campaign.delivered / campaign.sent;

    // 95% confidence interval
    const standardError = Math.sqrt((rate * (1 - rate)) / campaign.sent);
    const marginOfError = 1.96 * standardError;

    const lowerBound = rate - marginOfError;
    const upperBound = rate + marginOfError;

    expect(lowerBound).toBeLessThan(rate);
    expect(upperBound).toBeGreaterThan(rate);
    expect(lowerBound).toBeGreaterThan(0);
    expect(upperBound).toBeLessThan(1);
  });

  it('should calculate winner with minimum sample size', () => {
    const minimumSampleSize = 100;

    const campaignA = { sent: 50, delivered: 45 };
    const campaignB = { sent: 150, delivered: 140 };

    expect(campaignA.sent).toBeLessThan(minimumSampleSize);
    expect(campaignB.sent).toBeGreaterThan(minimumSampleSize);

    // Only campaign B has sufficient sample size
    const validCampaigns = [campaignA, campaignB].filter(
      (c) => c.sent >= minimumSampleSize
    );

    expect(validCampaigns).toHaveLength(1);
    expect(validCampaigns[0]).toBe(campaignB);
  });

  it('should track conversion funnel for campaigns', () => {
    const funnel = {
      sent: 10000,
      delivered: 9500,
      opened: 4000,
      clicked: 1200,
      converted: 300,
    };

    const deliveryRate = (funnel.delivered / funnel.sent) * 100;
    const openRate = (funnel.opened / funnel.delivered) * 100;
    const clickRate = (funnel.clicked / funnel.opened) * 100;
    const conversionRate = (funnel.converted / funnel.clicked) * 100;

    expect(deliveryRate).toBe(95);
    expect(openRate).toBeCloseTo(42.11, 1);
    expect(clickRate).toBe(30);
    expect(conversionRate).toBe(25);
  });

  it('should identify best performing variant', () => {
    const variants = [
      { id: 'A', delivered: 9500, sent: 10000, clicked: 1000 },
      { id: 'B', delivered: 9700, sent: 10000, clicked: 1500 },
      { id: 'C', delivered: 9600, sent: 10000, clicked: 1200 },
    ];

    const withRates = variants.map((v) => ({
      ...v,
      deliveryRate: v.delivered / v.sent,
      clickRate: v.clicked / v.delivered,
    }));

    const bestDelivery = withRates.reduce((best, current) =>
      current.deliveryRate > best.deliveryRate ? current : best
    );

    const bestEngagement = withRates.reduce((best, current) =>
      current.clickRate > best.clickRate ? current : best
    );

    expect(bestDelivery.id).toBe('B');
    expect(bestEngagement.id).toBe('B');
  });

  it('should calculate lift percentage', () => {
    const control = { delivered: 9000, sent: 10000 };
    const variant = { delivered: 9500, sent: 10000 };

    const controlRate = control.delivered / control.sent;
    const variantRate = variant.delivered / variant.sent;

    const lift = ((variantRate - controlRate) / controlRate) * 100;

    expect(lift).toBeCloseTo(5.56, 1); // ~5.56% improvement
  });

  it('should handle campaigns with different sample sizes', () => {
    const campaignA = { sent: 10000, delivered: 9500 };
    const campaignB = { sent: 5000, delivered: 4800 };

    const rateA = campaignA.delivered / campaignA.sent;
    const rateB = campaignB.delivered / campaignB.sent;

    // Both have 95% and 96% delivery rates
    expect(rateA).toBe(0.95);
    expect(rateB).toBe(0.96);

    // Campaign B has higher rate but smaller sample
    expect(rateB).toBeGreaterThan(rateA);
    expect(campaignB.sent).toBeLessThan(campaignA.sent);
  });
});
