"""
Synthetic Financial Transaction and Entity Generator for Fintel AML/CFT System.
Academic PBL Prototype - Generates realistic synthetic entities, transactions,
and 7 controlled suspicious typology scenarios with verifiable ground truth.
"""

import os
import json
import random
import pandas as pd
from datetime import datetime, timedelta

random.seed(42)

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "sample")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Synthetic Archetypes
FIRST_NAMES = [
    "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Reyansh", "Muhammad", "Sai",
    "Ananya", "Diya", "Saanvi", "Isha", "Rhea", "Tara", "Kavya", "Pooja",
    "John", "Sarah", "David", "Emily", "Michael", "Elena", "Marcus", "Chloe"
]

LAST_NAMES = [
    "Sharma", "Verma", "Patel", "Mehta", "Singh", "Nair", "Rao", "Gupta",
    "Deshmukh", "Iyer", "Khan", "Choudhury", "Smith", "Johnson", "Williams", "Taylor"
]

OCCUPATIONS = [
    "Software Engineer", "Merchant Exporter", "Consultant", "Retail Store Owner",
    "Textile Trader", "Real Estate Broker", "Jewelry Retailer", "Logistics Contractor",
    "Student", "Retired Civil Servant", "Freelance Designer", "Import-Export Agent"
]

COUNTRIES = ["IND", "UAE", "SGP", "GBR", "USA", "HKG", "MUS"]

def generate_synthetic_data(num_normal_customers=80, num_normal_accounts=120, num_normal_transactions=600):
    customers = []
    accounts = []
    transactions = []
    investigator_notes = []
    ground_truth = {}

    start_date = datetime(2026, 8, 1, 9, 0, 0)

    # 1. Normal Customers & Accounts
    for i in range(1, num_normal_customers + 1):
        cid = f"CUST-NORM-{i:03d}"
        first = random.choice(FIRST_NAMES)
        last = random.choice(LAST_NAMES)
        customers.append({
            "customer_id": cid,
            "name": f"{first} {last}",
            "country": random.choices(COUNTRIES, weights=[60, 10, 8, 8, 6, 4, 4])[0],
            "occupation": random.choice(OCCUPATIONS),
            "risk_level": random.choices(["LOW", "MEDIUM", "HIGH"], weights=[80, 16, 4])[0]
        })

    for i in range(1, num_normal_accounts + 1):
        aid = f"ACC-NORM-{i:03d}"
        assigned_customer = f"CUST-NORM-{random.randint(1, num_normal_customers):03d}"
        accounts.append({
            "account_id": aid,
            "customer_id": assigned_customer,
            "account_type": random.choices(["SAVINGS", "CURRENT", "BUSINESS"], weights=[55, 30, 15])[0],
            "created_at": (start_date - timedelta(days=random.randint(60, 1000))).strftime("%Y-%m-%d %H:%M:%S")
        })

    # Normal Transactions
    normal_account_ids = [a["account_id"] for a in accounts]
    tx_counter = 1

    for _ in range(num_normal_transactions):
        sender, receiver = random.sample(normal_account_ids, 2)
        tx_time = start_date + timedelta(
            days=random.randint(0, 30),
            hours=random.randint(0, 23),
            minutes=random.randint(0, 59),
            seconds=random.randint(0, 59)
        )
        amount = round(random.lognormvariate(mu=6.5, sigma=1.2), 2)
        amount = max(50.0, min(amount, 45000.0))
        transactions.append({
            "transaction_id": f"TX-{tx_counter:05d}",
            "sender_account": sender,
            "receiver_account": receiver,
            "amount": amount,
            "timestamp": tx_time.strftime("%Y-%m-%d %H:%M:%S"),
            "transaction_type": random.choice(["WIRE_TRANSFER", "NEFT", "RTGS", "UPI", "ACH"])
        })
        tx_counter += 1

    # ============================================================
    # 2. SUSPICIOUS SCENARIO 1: Rapid Movement of Funds (Pass-Through)
    # Target: ACC-SUSP-RAPID01
    # Customer: CUST-SUSP-01 (Rajesh Trading Co)
    # ============================================================
    c1 = "CUST-SUSP-01"
    a_rapid = "ACC-SUSP-RAPID01"
    customers.append({
        "customer_id": c1,
        "name": "Rajesh Kumar (Trading Sole Prop)",
        "country": "IND",
        "occupation": "Merchant Exporter",
        "risk_level": "HIGH"
    })
    accounts.append({
        "account_id": a_rapid,
        "customer_id": c1,
        "account_type": "CURRENT",
        "created_at": "2026-01-10 10:00:00"
    })
    ground_truth[a_rapid] = {
        "typology": "rapid_fund_movement",
        "description": "Large inbound wire swiftly followed by nearly full outflow within 3 hours.",
        "expected_risk": "HIGH"
    }

    t1_in = start_date + timedelta(days=5, hours=10, minutes=15)
    t1_out = t1_in + timedelta(hours=2, minutes=45)
    transactions.append({
        "transaction_id": f"TX-{tx_counter:05d}",
        "sender_account": normal_account_ids[0],
        "receiver_account": a_rapid,
        "amount": 78000.00,
        "timestamp": t1_in.strftime("%Y-%m-%d %H:%M:%S"),
        "transaction_type": "RTGS"
    })
    tx_counter += 1
    transactions.append({
        "transaction_id": f"TX-{tx_counter:05d}",
        "sender_account": a_rapid,
        "receiver_account": normal_account_ids[1],
        "amount": 76500.00,
        "timestamp": t1_out.strftime("%Y-%m-%d %H:%M:%S"),
        "transaction_type": "RTGS"
    })
    tx_counter += 1

    # ============================================================
    # 3. SUSPICIOUS SCENARIO 2: High-Value Transactions
    # Target: ACC-SUSP-HIVAL01
    # ============================================================
    c2 = "CUST-SUSP-02"
    a_hival = "ACC-SUSP-HIVAL01"
    customers.append({
        "customer_id": c2,
        "name": "Apex Bullion Offshore Ltd",
        "country": "UAE",
        "occupation": "Jewelry Retailer",
        "risk_level": "HIGH"
    })
    accounts.append({
        "account_id": a_hival,
        "customer_id": c2,
        "account_type": "BUSINESS",
        "created_at": "2025-11-04 11:30:00"
    })
    ground_truth[a_hival] = {
        "typology": "high_value_transfers",
        "description": "Multiple massive transactions exceeding institutional threshold $50k with minimal aging.",
        "expected_risk": "CRITICAL"
    }
    t2_time = start_date + timedelta(days=8, hours=14, minutes=20)
    for amt in [145000.00, 210000.00, 185000.00]:
        transactions.append({
            "transaction_id": f"TX-{tx_counter:05d}",
            "sender_account": a_hival,
            "receiver_account": random.choice(normal_account_ids),
            "amount": amt,
            "timestamp": t2_time.strftime("%Y-%m-%d %H:%M:%S"),
            "transaction_type": "WIRE_TRANSFER"
        })
        tx_counter += 1
        t2_time += timedelta(days=1, hours=3)

    # ============================================================
    # 4. SUSPICIOUS SCENARIO 3: Structuring / Smurfing (Below Threshold)
    # Target: ACC-SUSP-STRUCT01
    # Threshold is $10k; amounts are $9,400, $9,200, $9,650, $8,900
    # ============================================================
    c3 = "CUST-SUSP-03"
    a_struct = "ACC-SUSP-STRUCT01"
    customers.append({
        "customer_id": c3,
        "name": "Siddharth V. Consultancy",
        "country": "IND",
        "occupation": "Consultant",
        "risk_level": "MEDIUM"
    })
    accounts.append({
        "account_id": a_struct,
        "customer_id": c3,
        "account_type": "CURRENT",
        "created_at": "2026-02-14 09:00:00"
    })
    ground_truth[a_struct] = {
        "typology": "structuring_smurfing",
        "description": "Successive inbound transfers calibrated just below the regulatory threshold $10,000.",
        "expected_risk": "HIGH"
    }
    t3_time = start_date + timedelta(days=12, hours=9, minutes=0)
    for s_amt in [9600.00, 9450.00, 9200.00, 9800.00, 8950.00]:
        transactions.append({
            "transaction_id": f"TX-{tx_counter:05d}",
            "sender_account": random.choice(normal_account_ids),
            "receiver_account": a_struct,
            "amount": s_amt,
            "timestamp": t3_time.strftime("%Y-%m-%d %H:%M:%S"),
            "transaction_type": "NEFT"
        })
        tx_counter += 1
        t3_time += timedelta(hours=3, minutes=15)

    # ============================================================
    # 5. SUSPICIOUS SCENARIO 4: Mule Aggregator (Many-to-One Fan-In)
    # Target: ACC-SUSP-FANIN01
    # ============================================================
    c4 = "CUST-SUSP-04"
    a_fanin = "ACC-SUSP-FANIN01"
    customers.append({
        "customer_id": c4,
        "name": "Manish P. Logistics Network",
        "country": "IND",
        "occupation": "Logistics Contractor",
        "risk_level": "HIGH"
    })
    accounts.append({
        "account_id": a_fanin,
        "customer_id": c4,
        "account_type": "SAVINGS",
        "created_at": "2026-03-01 12:00:00"
    })
    ground_truth[a_fanin] = {
        "typology": "many_to_one_mule_aggregation",
        "description": "High in-degree fan-in from 7 separate source accounts followed by bulk consolidation.",
        "expected_risk": "HIGH"
    }
    t4_time = start_date + timedelta(days=15, hours=8, minutes=0)
    fanin_sources = random.sample(normal_account_ids, 7)
    for src in fanin_sources:
        transactions.append({
            "transaction_id": f"TX-{tx_counter:05d}",
            "sender_account": src,
            "receiver_account": a_fanin,
            "amount": round(random.uniform(4000.0, 7500.0), 2),
            "timestamp": t4_time.strftime("%Y-%m-%d %H:%M:%S"),
            "transaction_type": "UPI"
        })
        tx_counter += 1
        t4_time += timedelta(minutes=45)

    # Aggregated payout
    transactions.append({
        "transaction_id": f"TX-{tx_counter:05d}",
        "sender_account": a_fanin,
        "receiver_account": normal_account_ids[5],
        "amount": 38500.00,
        "timestamp": (t4_time + timedelta(hours=2)).strftime("%Y-%m-%d %H:%M:%S"),
        "transaction_type": "RTGS"
    })
    tx_counter += 1

    # ============================================================
    # 6. SUSPICIOUS SCENARIO 5: Fan-out Layering (One-to-Many Dispersion)
    # Target: ACC-SUSP-FANOUT01
    # ============================================================
    c5 = "CUST-SUSP-05"
    a_fanout = "ACC-SUSP-FANOUT01"
    customers.append({
        "customer_id": c5,
        "name": "Global Horizon Clearing FZE",
        "country": "SGP",
        "occupation": "Import-Export Agent",
        "risk_level": "HIGH"
    })
    accounts.append({
        "account_id": a_fanout,
        "customer_id": c5,
        "account_type": "BUSINESS",
        "created_at": "2025-10-15 14:00:00"
    })
    ground_truth[a_fanout] = {
        "typology": "one_to_many_fanout_layering",
        "description": "Massive single deposit fragmented and dispersed to 6 different destination accounts rapidly.",
        "expected_risk": "HIGH"
    }
    t5_time = start_date + timedelta(days=18, hours=10, minutes=0)
    # Large lump sum in
    transactions.append({
        "transaction_id": f"TX-{tx_counter:05d}",
        "sender_account": normal_account_ids[8],
        "receiver_account": a_fanout,
        "amount": 92000.00,
        "timestamp": t5_time.strftime("%Y-%m-%d %H:%M:%S"),
        "transaction_type": "WIRE_TRANSFER"
    })
    tx_counter += 1

    fanout_dests = random.sample(normal_account_ids[10:30], 6)
    for dst in fanout_dests:
        transactions.append({
            "transaction_id": f"TX-{tx_counter:05d}",
            "sender_account": a_fanout,
            "receiver_account": dst,
            "amount": 14900.00,
            "timestamp": (t5_time + timedelta(hours=1, minutes=random.randint(10, 80))).strftime("%Y-%m-%d %H:%M:%S"),
            "transaction_type": "NEFT"
        })
        tx_counter += 1

    # ============================================================
    # 7. SUSPICIOUS SCENARIO 6: High Velocity Bursts
    # Target: ACC-SUSP-BURST01
    # ============================================================
    c6 = "CUST-SUSP-06"
    a_burst = "ACC-SUSP-BURST01"
    customers.append({
        "customer_id": c6,
        "name": "Vikram Real Estate Brokers",
        "country": "IND",
        "occupation": "Real Estate Broker",
        "risk_level": "MEDIUM"
    })
    accounts.append({
        "account_id": a_burst,
        "customer_id": c6,
        "account_type": "CURRENT",
        "created_at": "2026-03-20 16:00:00"
    })
    ground_truth[a_burst] = {
        "typology": "high_velocity_burst",
        "description": "Abnormal burst of 10 wire transfers in less than 2 hours.",
        "expected_risk": "HIGH"
    }
    t6_time = start_date + timedelta(days=22, hours=14, minutes=0)
    for k in range(10):
        partner = random.choice(normal_account_ids)
        is_sender = (k % 2 == 0)
        transactions.append({
            "transaction_id": f"TX-{tx_counter:05d}",
            "sender_account": a_burst if is_sender else partner,
            "receiver_account": partner if is_sender else a_burst,
            "amount": round(random.uniform(5000.0, 12000.0), 2),
            "timestamp": (t6_time + timedelta(minutes=k * 8)).strftime("%Y-%m-%d %H:%M:%S"),
            "transaction_type": "WIRE_TRANSFER"
        })
        tx_counter += 1

    # ============================================================
    # 8. SUSPICIOUS SCENARIO 7: Circular Layering Chain
    # Target: ACC-SUSP-CHAIN01 -> ACC-SUSP-CHAIN02 -> ACC-SUSP-CHAIN03 -> ACC-SUSP-CHAIN01
    # ============================================================
    c7 = "CUST-SUSP-07"
    chain_accs = ["ACC-SUSP-CHAIN01", "ACC-SUSP-CHAIN02", "ACC-SUSP-CHAIN03"]
    customers.append({
        "customer_id": c7,
        "name": "Pinnacle Offshore Holdings",
        "country": "MUS",
        "occupation": "Merchant Exporter",
        "risk_level": "HIGH"
    })
    for ca in chain_accs:
        accounts.append({
            "account_id": ca,
            "customer_id": c7,
            "account_type": "BUSINESS",
            "created_at": "2025-09-01 10:00:00"
        })
        ground_truth[ca] = {
            "typology": "circular_layering_chain",
            "description": "Circular transaction loop through multiple offshore shell accounts to obscure source.",
            "expected_risk": "CRITICAL"
        }

    t7_time = start_date + timedelta(days=25, hours=11, minutes=0)
    chain_loop = [
        (chain_accs[0], chain_accs[1], 65000.00),
        (chain_accs[1], chain_accs[2], 64200.00),
        (chain_accs[2], chain_accs[0], 63800.00)
    ]
    for s, r, amt in chain_loop:
        transactions.append({
            "transaction_id": f"TX-{tx_counter:05d}",
            "sender_account": s,
            "receiver_account": r,
            "amount": amt,
            "timestamp": t7_time.strftime("%Y-%m-%d %H:%M:%S"),
            "transaction_type": "WIRE_TRANSFER"
        })
        tx_counter += 1
        t7_time += timedelta(hours=4)

    # 9. Investigator Notes
    investigator_notes.append({
        "note_id": "NOTE-0001",
        "case_id": "CASE-AUTO-001",
        "target_account": a_rapid,
        "note_text": "Customer profile indicates low historical turnover. A sudden $78,000 credit followed immediately by an outward transfer is highly anomalous.",
        "created_at": (start_date + timedelta(days=6)).strftime("%Y-%m-%d %H:%M:%S")
    })
    investigator_notes.append({
        "note_id": "NOTE-0002",
        "case_id": "CASE-AUTO-002",
        "target_account": a_struct,
        "note_text": "Frequent deposits just below the $10,000 threshold flag potential smurfing activity.",
        "created_at": (start_date + timedelta(days=13)).strftime("%Y-%m-%d %H:%M:%S")
    })

    # Convert to DataFrames and Export CSVs
    df_customers = pd.DataFrame(customers)
    df_accounts = pd.DataFrame(accounts)
    df_transactions = pd.DataFrame(transactions)
    df_notes = pd.DataFrame(investigator_notes)

    df_customers.to_csv(os.path.join(OUTPUT_DIR, "customers.csv"), index=False)
    df_accounts.to_csv(os.path.join(OUTPUT_DIR, "accounts.csv"), index=False)
    df_transactions.to_csv(os.path.join(OUTPUT_DIR, "transactions.csv"), index=False)
    df_notes.to_csv(os.path.join(OUTPUT_DIR, "investigator_notes.csv"), index=False)

    with open(os.path.join(OUTPUT_DIR, "ground_truth_labels.json"), "w", encoding="utf-8") as f:
        json.dump(ground_truth, f, indent=2)

    print(f"Generated {len(df_customers)} customers, {len(df_accounts)} accounts, "
          f"{len(df_transactions)} transactions, and {len(df_notes)} notes.")
    print(f"Identified {len(ground_truth)} ground truth suspicious accounts across 7 typologies.")
    return df_customers, df_accounts, df_transactions, ground_truth


if __name__ == "__main__":
    generate_synthetic_data()
