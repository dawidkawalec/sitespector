"""
Migrate existing users from VPS PostgreSQL to Supabase Auth.

IMPORTANT: Run this ONCE after Supabase setup is complete.

This script:
1. Reads all users from VPS PostgreSQL
2. Creates them in Supabase Auth (with temporary password)
3. Creates personal workspace for each user
4. Links existing audits to new workspace
5. Sends password reset emails

Usage:
    python backend/scripts/migrate_users_to_supabase.py
"""

import asyncio
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database import AsyncSessionLocal
from app.models import User, Audit
from app.lib.supabase import supabase
from sqlalchemy import select, update
from datetime import datetime


async def migrate_users():
    """Migrate all users from VPS PostgreSQL to Supabase."""
    
    print("=" * 80)
    print("SiteSpector User Migration to Supabase")
    print("=" * 80)
    print()
    
    async with AsyncSessionLocal() as db:
        # Get all users from VPS database
        result = await db.execute(select(User))
        users = result.scalars().all()
        
        print(f"📊 Found {len(users)} users to migrate\n")
        
        if len(users) == 0:
            print("✅ No users to migrate. Exiting.")
            return
        
        # Ask for confirmation
        print("⚠️  WARNING: This will create users in Supabase Auth.")
        print("   Existing users will need to reset their passwords.")
        print()
        response = input("Continue? (yes/no): ")
        
        if response.lower() != 'yes':
            print("❌ Migration cancelled.")
            return
        
        print()
        print("-" * 80)
        print()
        
        migration_summary = {
            "success": 0,
            "failed": 0,
            "errors": []
        }
        
        for idx, user in enumerate(users, 1):
            print(f"[{idx}/{len(users)}] Migrating: {user.email}")
            
            try:
                # 1. Create user in Supabase Auth
                print(f"  → Creating user in Supabase Auth...")
                auth_response = supabase.auth.admin.create_user({
                    "email": user.email,
                    "password": "TEMPORARY_PASSWORD_" + user.id.hex[:16],  # Temporary
                    "email_confirm": True,
                    "user_metadata": {
                        "migrated_from_poc": True,
                        "original_id": str(user.id),
                        "migrated_at": datetime.utcnow().isoformat()
                    }
                })
                
                if not auth_response or not auth_response.user:
                    raise Exception("Failed to create user in Supabase")
                
                supabase_user_id = auth_response.user.id
                print(f"  ✓ Supabase user created: {supabase_user_id}")
                
                # 2. Create personal workspace
                print(f"  → Creating personal workspace...")
                workspace_slug = user.email.split("@")[0] + "-" + user.id.hex[:8]
                
                workspace_response = supabase.table("workspaces").insert({
                    "name": f"{user.email}'s Workspace",
                    "slug": workspace_slug,
                    "type": "personal",
                    "owner_id": supabase_user_id
                }).execute()
                
                if not workspace_response.data:
                    raise Exception("Failed to create workspace")
                
                workspace_id = workspace_response.data[0]["id"]
                print(f"  ✓ Workspace created: {workspace_id}")
                
                # 3. Add user as workspace owner
                print(f"  → Adding user as workspace owner...")
                member_response = supabase.table("workspace_members").insert({
                    "workspace_id": workspace_id,
                    "user_id": supabase_user_id,
                    "role": "owner"
                }).execute()
                
                if not member_response.data:
                    raise Exception("Failed to add user to workspace")
                
                print(f"  ✓ Workspace membership created")
                
                # 4. Create free subscription (should be auto-created by trigger, but ensure it exists)
                print(f"  → Ensuring subscription exists...")
                subscription_check = supabase.table("subscriptions").select("*").eq(
                    "workspace_id", workspace_id
                ).execute()
                
                if not subscription_check.data:
                    supabase.table("subscriptions").insert({
                        "workspace_id": workspace_id,
                        "plan": "free",
                        "status": "active",
                        "audit_limit": 5,
                        "audits_used_this_month": 0
                    }).execute()
                    print(f"  ✓ Subscription created")
                else:
                    print(f"  ✓ Subscription already exists")
                
                # 5. Update audits to link to workspace
                print(f"  → Linking existing audits to workspace...")
                audit_update_result = await db.execute(
                    update(Audit)
                    .where(Audit.user_id == user.id)
                    .values(workspace_id=workspace_id)
                )
                await db.commit()
                
                audits_count = audit_update_result.rowcount
                print(f"  ✓ Linked {audits_count} audits to workspace")
                
                # 6. Generate password reset link
                print(f"  → Generating password reset link...")
                reset_response = supabase.auth.admin.generate_link({
                    "type": "magiclink",
                    "email": user.email
                })
                
                if reset_response and reset_response.properties:
                    magic_link = reset_response.properties.action_link
                    print(f"  ✓ Magic link: {magic_link}")
                    print(f"  📧 Send this link to user for first login")
                
                print(f"✅ Successfully migrated: {user.email}")
                print()
                
                migration_summary["success"] += 1
                
            except Exception as e:
                print(f"❌ Error migrating {user.email}: {str(e)}")
                print()
                migration_summary["failed"] += 1
                migration_summary["errors"].append({
                    "email": user.email,
                    "error": str(e)
                })
        
        # Summary
        print("=" * 80)
        print("Migration Summary")
        print("=" * 80)
        print(f"✅ Successful: {migration_summary['success']}")
        print(f"❌ Failed: {migration_summary['failed']}")
        print(f"📊 Total: {len(users)}")
        print()
        
        if migration_summary["errors"]:
            print("Errors encountered:")
            for error in migration_summary["errors"]:
                print(f"  - {error['email']}: {error['error']}")
        
        print()
        print("🎉 Migration complete!")
        print()
        print("📧 Next steps:")
        print("   1. Send password reset emails to all migrated users")
        print("   2. Test login with Supabase Auth")
        print("   3. Verify audits are linked to workspaces")
        print()


if __name__ == "__main__":
    asyncio.run(migrate_users())
