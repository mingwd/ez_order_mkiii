from django.contrib.auth.models import User
from django.db import models

from restaurants.models import (
    CuisineTag,
    ProteinTag,
    SpicinessTag,
    MealTypeTag,
    FlavorTag,
    AllergenTag,
    NutritionTag,
)


class UserProfile(models.Model):
    USER_TYPE_CHOICES = [
        ("customer", "Customer"),
        ("owner", "Owner"),
    ]

    ACTIVITY_LEVEL_CHOICES = [
        ("sedentary", "Sedentary / office"),
        ("light", "Lightly active"),
        ("active", "Active"),
        ("athlete", "Athlete"),
    ]

    GENDER_TYPE_CHOICES = [
        ("male", "Male"),
        ("female", "Female"),
        ("other", "Other"),
    ]

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="profile",
    )
    user_type = models.CharField(
        max_length=20,
        choices=USER_TYPE_CHOICES,
        default="customer",
    )

    # ===== Health =====
    height_cm = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    weight_kg = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    age = models.PositiveIntegerField(null=True, blank=True)
    gender = models.CharField(max_length=20, choices=GENDER_TYPE_CHOICES, blank=True,)
    activity_level = models.CharField(
        max_length=20,
        choices=ACTIVITY_LEVEL_CHOICES,
        blank=True,
    )
    bmr = models.DecimalField(
        max_digits=7,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Basal Metabolic Rate, internal use only",
    )

    memo = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # ===== Preferences（全部 through，有 score，命名统一 past_xxx） =====

    past_cuisines = models.ManyToManyField(
        CuisineTag,
        through="UserCuisinePreference",
        related_name="past_by_profiles",
        blank=True,
    )

    past_flavors = models.ManyToManyField(
        FlavorTag,
        through="UserFlavorPreference",
        related_name="past_by_profiles",
        blank=True,
    )

    past_nutritions = models.ManyToManyField(
        NutritionTag,
        through="UserNutritionPreference",
        related_name="past_by_profiles",
        blank=True,
    )

    past_proteins = models.ManyToManyField(
        ProteinTag,
        through="UserProteinPreference",
        related_name="past_by_profiles",
        blank=True,
    )

    past_spice_levels = models.ManyToManyField(
        SpicinessTag,
        through="UserSpicePreference",
        related_name="past_by_profiles",
        blank=True,
    )

    past_allergens = models.ManyToManyField(
        AllergenTag,
        through="UserAllergenPreference",
        related_name="past_by_profiles",
        blank=True,
    )

    past_meal_types = models.ManyToManyField(
        MealTypeTag,
        through="UserMealTypePreference",
        related_name="past_by_profiles",
        blank=True,
    )

    def __str__(self):
        return f"{self.user.username} ({self.user_type})"



class UserCuisinePreference(models.Model):
    profile = models.ForeignKey(
        UserProfile,
        on_delete=models.CASCADE,
        related_name="cuisine_prefs",
    )
    tag = models.ForeignKey(
        CuisineTag,
        on_delete=models.CASCADE,
        related_name="user_prefs",
    )
    score = models.IntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [("profile", "tag")]

    def __str__(self):
        return f"{self.profile.user.username} - cuisine:{self.tag.key} ({self.score})"


class UserFlavorPreference(models.Model):
    profile = models.ForeignKey(
        UserProfile,
        on_delete=models.CASCADE,
        related_name="flavor_prefs",
    )
    tag = models.ForeignKey(
        FlavorTag,
        on_delete=models.CASCADE,
        related_name="user_prefs",
    )
    score = models.IntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [("profile", "tag")]

    def __str__(self):
        return f"{self.profile.user.username} - flavor:{self.tag.key} ({self.score})"


class UserNutritionPreference(models.Model):
    profile = models.ForeignKey(
        UserProfile,
        on_delete=models.CASCADE,
        related_name="nutrition_prefs",
    )
    tag = models.ForeignKey(
        NutritionTag,
        on_delete=models.CASCADE,
        related_name="user_prefs",
    )
    score = models.IntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [("profile", "tag")]

    def __str__(self):
        return f"{self.profile.user.username} - nutrition:{self.tag.key} ({self.score})"


class UserProteinPreference(models.Model):
    profile = models.ForeignKey(
        UserProfile,
        on_delete=models.CASCADE,
        related_name="protein_prefs",
    )
    tag = models.ForeignKey(
        ProteinTag,
        on_delete=models.CASCADE,
        related_name="user_prefs",
    )
    score = models.IntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [("profile", "tag")]

    def __str__(self):
        return f"{self.profile.user.username} - protein:{self.tag.key} ({self.score})"


class UserSpicePreference(models.Model):
    profile = models.ForeignKey(
        UserProfile,
        on_delete=models.CASCADE,
        related_name="spice_prefs",
    )
    tag = models.ForeignKey(
        SpicinessTag,
        on_delete=models.CASCADE,
        related_name="user_prefs",
    )
    score = models.IntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [("profile", "tag")]

    def __str__(self):
        return f"{self.profile.user.username} - spice:{self.tag.key} ({self.score})"


class UserAllergenPreference(models.Model):
    profile = models.ForeignKey(
        UserProfile,
        on_delete=models.CASCADE,
        related_name="allergen_prefs",
    )
    tag = models.ForeignKey(
        AllergenTag,
        on_delete=models.CASCADE,
        related_name="user_prefs",
    )
    score = models.IntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [("profile", "tag")]

    def __str__(self):
        return f"{self.profile.user.username} - allergen:{self.tag.key} ({self.score})"


class UserMealTypePreference(models.Model):
    profile = models.ForeignKey(
        UserProfile,
        on_delete=models.CASCADE,
        related_name="mealtype_prefs",
    )
    tag = models.ForeignKey(
        MealTypeTag,
        on_delete=models.CASCADE,
        related_name="user_prefs",
    )
    score = models.IntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [("profile", "tag")]

    def __str__(self):
        return f"{self.profile.user.username} - mealtype:{self.tag.key} ({self.score})"