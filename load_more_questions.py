#!/usr/bin/env python
"""
Load comprehensive technical questions into Django database for all categories
"""

import os
import sys
import django

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import TechnicalQuestion

print("\n" + "="*70)
print("LOADING COMPREHENSIVE TECHNICAL QUESTIONS")
print("="*70)

# Comprehensive questions for each category
questions_by_category = {
    'dsa': {
        'difficulty': 'medium',
        'questions': [
            ("What is the time complexity of binary search?", "O(log n) - divides search space in half each iteration"),
            ("Explain the difference between arrays and linked lists.", "Arrays have O(1) access, O(n) insertion. Linked lists have O(n) access, O(1) insertion."),
            ("What is a hash table and how does collision resolution work?", "Hash table uses hash function to map keys to indices. Collisions resolved via chaining or open addressing."),
            ("How do you detect a cycle in a linked list?", "Use Floyd's cycle detection (tortoise and hare) with two pointers at different speeds."),
            ("What is the space complexity of quicksort?", "O(log n) for recursive call stack, O(n) worst case including partitioning."),
            ("Explain binary search tree (BST) properties.", "Left child < parent < right child. Enables O(log n) search, insert, delete."),
            ("What is dynamic programming?", "Technique to solve problems by breaking into subproblems, storing results to avoid recomputation."),
            ("Explain merge sort algorithm.", "Divide-and-conquer: divide array in half, recursively sort, merge sorted halves. O(n log n) time."),
            ("What is a balanced binary search tree?", "AVL or Red-Black tree where heights of subtrees differ by at most 1, ensuring O(log n) operations."),
            ("Explain graph traversal: DFS vs BFS.", "DFS uses stack (recursive), BFS uses queue. DFS: O(V+E), BFS: O(V+E)."),
        ]
    },
    'dbms': {
        'difficulty': 'medium',
        'questions': [
            ("What is ACID in databases?", "Atomicity: all or nothing, Consistency: valid state, Isolation: concurrent independence, Durability: persistent."),
            ("Explain SQL joins - INNER, LEFT, RIGHT, FULL.", "INNER: matching rows, LEFT: all from left table, RIGHT: all from right, FULL: all rows."),
            ("What is database normalization and its forms?", "1NF: atomic values, 2NF: no partial dependencies, 3NF: no transitive dependencies, BCNF: stricter 3NF."),
            ("What is indexing and why is it important?", "Creates sorted data structure for fast lookup. Speeds up queries but slows writes."),
            ("Explain the difference between primary and foreign keys.", "Primary key uniquely identifies row, foreign key references primary key in another table."),
            ("What is a transaction?", "Sequence of SQL operations treated as single atomic unit following ACID properties."),
            ("Explain the difference between DROP, DELETE, and TRUNCATE.", "DROP removes table structure, DELETE removes rows with WHERE clause, TRUNCATE removes all rows fast."),
            ("What is a stored procedure?", "Pre-compiled SQL code stored in database, executed with parameters, reduces network traffic."),
            ("Explain database locking and deadlocks.", "Locks prevent concurrent modification. Deadlock: circular wait for locks, resolved by timeout or detection."),
            ("What is a view in SQL?", "Virtual table based on query result, simplifies complex queries, provides security layer."),
        ]
    },
    'os': {
        'difficulty': 'medium',
        'questions': [
            ("What is the difference between processes and threads?", "Process: independent execution unit with own memory. Thread: lightweight, shares process memory."),
            ("Explain deadlock and its conditions.", "All 4 conditions needed: mutual exclusion, hold and wait, no preemption, circular wait."),
            ("What is virtual memory?", "Technique using disk as extension of RAM, allows programs larger than physical memory."),
            ("Explain the purpose of an operating system.", "Manages hardware resources, provides user interface, ensures fair process scheduling, handles I/O."),
            ("What is the difference between synchronous and asynchronous I/O?", "Sync: process waits for I/O completion. Async: process continues, notified when done."),
            ("Explain context switching.", "OS saves process state and loads another process state. Overhead but enables multitasking."),
            ("What are semaphores and mutexes?", "Both synchronization primitives. Semaphore: counter for multiple resources. Mutex: binary lock for one resource."),
            ("Explain page replacement algorithms (LRU, FIFO).", "LRU: remove least recently used page. FIFO: remove oldest page. LRU typically better but more complex."),
            ("What is a race condition?", "Multiple processes access shared resource without synchronization, causing unpredictable results."),
            ("Explain CPU scheduling algorithms (Round Robin, Priority, SJF).", "RR: fair time slices. Priority: high priority first. SJF: shortest job first for efficiency."),
        ]
    },
    'cn': {
        'difficulty': 'medium',
        'questions': [
            ("Explain the TCP/IP model.", "5 layers: Application, Transport, Internet, Link, Physical. Modern standard for networking."),
            ("What is the difference between TCP and UDP?", "TCP: reliable, ordered, connection-based. UDP: unreliable, fast, connectionless."),
            ("How does DNS work?", "Translates domain names to IP addresses. Recursive/iterative queries through DNS hierarchy."),
            ("Explain the OSI model.", "7 layers from Physical to Application. Framework for network protocols and communication."),
            ("What is IP addressing and subnetting?", "IPv4: 32 bits. Subnetting divides network into subnetworks using subnet mask."),
            ("Explain HTTP vs HTTPS.", "HTTP: insecure, plain text. HTTPS: secure, uses SSL/TLS encryption."),
            ("What is a MAC address?", "Physical address identifying device on local network. Used at data link layer."),
            ("Explain routing and routers.", "Routers forward packets between networks using routing tables and IP addresses."),
            ("What is NAT (Network Address Translation)?", "Maps private IP addresses to public IP, enables multiple devices with one public IP."),
            ("Explain the three-way handshake in TCP.", "SYN, SYN-ACK, ACK exchange to establish connection before data transfer."),
        ]
    },
    'git': {
        'difficulty': 'medium',
        'questions': [
            ("What is the difference between git clone and git fork?", "Clone: download repository locally. Fork: create separate copy on GitHub for contribution."),
            ("Explain git rebase vs git merge.", "Merge: creates merge commit, preserves history. Rebase: rewrites history, linear but cleaner."),
            ("What is a git cherry-pick?", "Applies specific commit to current branch without merging entire branch."),
            ("How do you resolve merge conflicts?", "Manually edit conflicted files, mark as resolved, commit. Or use git merge tools."),
            ("What is the purpose of .gitignore?", "Specifies files/folders to exclude from version control (node_modules, .env, etc)."),
            ("Explain git stash.", "Temporarily saves uncommitted changes without committing, allows switching branches."),
            ("What is a branch and why use it?", "Isolated development line. Allows parallel development without affecting main code."),
            ("Explain git revert vs git reset.", "Revert: creates new commit undoing changes. Reset: moves HEAD to previous commit, loses history."),
            ("What is a pull request?", "Request to merge code changes. Enables code review before integration."),
            ("Explain git tagging.", "Marks specific points in repository history, typically for releases (v1.0, v2.0)."),
        ]
    },
    'web': {
        'difficulty': 'medium',
        'questions': [
            ("Explain the request-response cycle in web development.", "Client sends request to server, server processes, returns response with data/HTML/JSON."),
            ("What is the difference between REST and GraphQL?", "REST: multiple endpoints per resource. GraphQL: single endpoint, client specifies needed data."),
            ("Explain CORS and why it's important.", "Cross-Origin Resource Sharing: allows requests from different domains. Prevents unauthorized access."),
            ("What is JWT authentication?", "JSON Web Token: token-based auth. Contains user info, signed by server, stateless."),
            ("Explain the difference between HTTP and HTTPS.", "HTTP: insecure, plain text transmission. HTTPS: secure, SSL/TLS encrypted."),
            ("What is a cookie and session?", "Cookie: small data stored on client. Session: server-side data associated with client."),
            ("Explain middleware in web frameworks.", "Functions executing between request and response, handling auth, logging, error handling."),
            ("What is responsive design?", "Website adapts to different screen sizes using CSS media queries and flexible layouts."),
            ("Explain MVC architecture.", "Model (data), View (UI), Controller (logic). Separates concerns for maintainability."),
            ("What is caching and why important?", "Stores frequently accessed data in memory. Reduces database hits, improves performance."),
        ]
    }
}

# Load questions
total_added = 0

for category, data in questions_by_category.items():
    existing_count = TechnicalQuestion.objects.filter(category=category).count()
    
    for question_text, reference_answer in data['questions']:
        # Check if question already exists
        if not TechnicalQuestion.objects.filter(
            category=category,
            question_text=question_text
        ).exists():
            TechnicalQuestion.objects.create(
                category=category,
                question_text=question_text,
                reference_answer=reference_answer,
                difficulty=data['difficulty']
            )
            total_added += 1
    
    new_count = TechnicalQuestion.objects.filter(category=category).count()
    print(f"✓ {category.upper()}: {new_count} questions ({new_count - existing_count} new)")

# Summary
print("\n" + "="*70)
print("SUMMARY")
print("="*70)
print(f"Total questions loaded: {TechnicalQuestion.objects.count()}")
print("\nQuestions by category:")
for category in questions_by_category.keys():
    count = TechnicalQuestion.objects.filter(category=category).count()
    print(f"  - {category.upper()}: {count}")

print("\n✓ All technical sections loaded successfully!")
print("✓ Refresh app to see new questions!")
print("="*70 + "\n")
