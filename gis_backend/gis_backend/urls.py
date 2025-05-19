"""
URL configuration for gis_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from Location.views import location_list, location_detail, filter_locations

urlpatterns = [
    path('admin/', admin.site.urls),
     path('locations/', location_list, name='location_list'),
    path('locations/<int:pk>/', location_detail, name='location_detail'),
    path('locations/filter/', filter_locations, name='filter_locations'),

]





