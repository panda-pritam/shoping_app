from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class Location(models.Model):

    
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('unk', 'Unk'),
    )
    
    name = models.CharField(max_length=255)
    lat = models.FloatField()
    lng = models.FloatField()
    location_name = models.CharField(max_length=255)
    type = models.CharField(max_length=20)
    usage = models.TextField(help_text="Short description of location usage")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    last_serviced_date = models.DateField(null=True, blank=True)
    bockmarked=models.BooleanField(default=False,null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    
    def __str__(self):
        return f"{self.name} - {self.location_name}"


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    bio = models.TextField(blank=True)
    phone_number = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Profile for {self.user.username}"