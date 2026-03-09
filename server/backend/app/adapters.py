from allauth.account.adapter import DefaultAccountAdapter
from .models import Profile


class CustomAccountAdapter(DefaultAccountAdapter):
    def save_user(self, request, user, form, commit=True):
        # Resolve role before calling super (form may be serializer with validated_data)
        role = None
        if hasattr(form, "validated_data"):
            role = form.validated_data.get("role")
        if not role and hasattr(form, "cleaned_data"):
            role = form.cleaned_data.get("role")
        if not role and hasattr(request, "data") and isinstance(getattr(request, "data", None), dict):
            role = request.data.get("role")

        user = super().save_user(request, user, form, commit=commit)

        if not user.pk:
            user.save()

        if role:
            profile, _ = Profile.objects.get_or_create(user=user)
            profile.role = role
            profile.save()

        return user