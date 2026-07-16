                        Users
                          │
                          ▼
                   Social Media Feed
                          │
            ┌─────────────┴─────────────┐
            │                           │
            ▼                           ▼
      Organic Posts              Ad Request
                                      │
                                      ▼
                           Ad Decision Engine
                                      │
              ┌───────────────────────┼────────────────────────┐
              │                       │                        │
              ▼                       ▼                        ▼
      Business Owners Ads         Google Ads              House Ads
   (Direct Campaigns)         (Google Ad Manager)      (Fallback)
              │                       │                        │
              └───────────────Select Best Ad──────────────────┘
                                      │
                                      ▼
                              Render Advertisement
                                      │
                                      ▼
                        Impression & Click Tracking
                                      │
                                      ▼
                         Analytics + Billing System


System Components
1. Advertiser Portal

Businesses create ads here.

Features

Login
Create Campaign
Upload Images/Videos
Budget
Target Audience
Schedule
Payment
Campaign Reports

Campaign

Name:
Summer Promo

Budget:
$500

Audience:
Nigeria
Age 18-35

Placement:
Feed
Video
Stories

Start:
Today

End:
30 Days

2. Campaign Management Service

Stores campaigns.

Example Database

Campaign

ID

AdvertiserID

Budget

RemainingBudget

Status

StartDate

EndDate

Bid

TargetCountry

TargetAge

Category

3. Google Ads Connector

Instead of showing only your own ads...

The system can ask Google

"Do you have a better-paying advertisement?"

Flow

User opens feed

↓

System checks internal campaigns

↓

Calls Google Ad Manager

↓

Google returns CPM

↓

Compare revenues

↓

Highest wins

4. Ad Decision Engine (The Brain)

This decides

"What advertisement should this user see?"

Input

User

Age

Country

Language

Interests

Gender

Device

Time

Location

Also checks

Campaign Budget

Frequency Cap

Bid

Priority

Target Audience

Campaign Status

Output

Ad 385

Decision Logic

Example

Internal Business Ad CPM = $2.80

Google CPM = $1.70

Winner:

Business Ad

Another

Business Ad = $0.40

Google = $1.90

Winner

Google

Priority Algorithm
IF Premium Sponsor exists

Serve Premium

ELSE

Compare

Business CPM

Google CPM

Highest wins

ELSE

Show House Ad

5. Ad Placement Service

Different locations.

Feed

Post

Post

Advertisement

Post

Post

Advertisement

Videos

Pre-roll

Mid-roll

Post-roll


Search

Sponsored Result

Trending

Sponsored Trend

6. Frequency Control

Nobody wants the same ad 20 times.

Example

Maximum

3 impressions

per

24 hours

per user

Database

UserID

CampaignID

Impressions

LastSeen

7. Budget Manager

Every impression decreases budget.

Example

Budget

$100

CPM

$2

Every 1000 impressions

↓

Budget becomes

$98

If budget reaches zero

Campaign pauses automatically

8. Payment Service

Supports

Business advertisers
They will have wallet balance which can be topped up - post paid.

Flutterwave
Paystack
Free Credit by Intasela for advertisers.

Stores

Invoices

Transactions

Receipts

9. Analytics Service

Tracks everything.

Metrics

Impressions

Clicks

CTR

Conversions

Revenue

CPM

CPC

CPA

Watch Time

Viewability

Dashboard

Today's Revenue

Business Ads

Google Ads

Top Campaigns

Top Countries

Top states

Top Devices

10. Campaign Approval Workflow

Every campaign needs approval.

Steps

Submit Campaign

Pending Review

Approved or Rejected

Reason Given

If Rejected

Advertiser edits

Resubmit

Repeat

11. House Ads (Backup)

When no ads are available.

House Ads:

Your own posts

Promoted posts

Premium posts

12. Fraud Detection

Prevent

Click Farms
Bots
Fake Impressions
Multiple Clicks

Checks

IP

Fingerprint

User Agent

Behavior

Time Between Clicks

13. Reporting System

Advertiser sees

Spend

Remaining Budget

Reach

CTR

Top Cities

Age Groups

Devices

Conversions
Database Design
Advertiser
Advertiser

id

company_name

email

phone

verified
Campaign
Campaign

id

advertiser_id

budget

remaining_budget

status

start

end

bid

objective

frequency_cap
Creative
Creative

id

campaign_id

image

video

headline

description

cta
Impression
Impression

id

campaign_id

user_id

time

device

country

cost
Click
Click

id

campaign

user

timestamp

ip
Ad Serving Flow
User Opens Feed

↓

Frontend requests advertisement

↓

API Gateway

↓

Authentication

↓

User Profile Service

↓

Ad Decision Engine

↓

Checks

↓

Internal Campaigns

↓

Google Ads

↓

Auction

↓

Winner Selected

↓

Serve Advertisement

↓

Track Impression

↓

Track Click

↓

Update Budget

↓

Analytics
Revenue Model

Imagine

Business A

Pays

$5 CPM

Google

Returns

$3 CPM

Business wins.

Another request

Business

$1 CPM

Google

$4 CPM

Google wins.

