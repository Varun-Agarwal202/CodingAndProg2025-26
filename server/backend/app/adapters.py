from allauth.account.adapter import DefaultAccountAdapter
from .models import Profile
import pprint

class CustomAccountAdapter(DefaultAccountAdapter):
    def save_user(self, request, user, form, commit=True):
        user = super().save_user(request, user, form, commit=commit)

        try:
            print("CustomAccountAdapter.save_user called")
            print(" request.data type:", type(getattr(request, "data", None)))
            pprint.pprint(getattr(request, "data", None))
        except Exception:
            print("could not pprint request.data")

        # resolve role
        role = None
        try:
            role = getattr(request, "data", {}) and request.data.get("role")
        except Exception:
            role = None
        if not role and hasattr(form, "cleaned_data"):
            role = form.cleaned_data.get("role")

        print(" resolved role:", role)

        # ensure user saved
        if not user.pk:
            user.save()
            print(" saved user with pk:", user.pk)

        if role:
            # Save immediately (not deferred)
            profile, created = Profile.objects.get_or_create(user=user)
            profile.role = role
            profile.save()
            print(" Profile set immediately:", profile.id, "created:", created, "role:", profile.role)
        else:
            print(" No role provided; skipping profile update")

        return user