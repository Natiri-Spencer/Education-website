"""
URL configuration for spencer_project project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
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
from django.urls import path,include
from django.conf import settings
from django.conf.urls.static import static
from educations import views as education_views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', education_views.home, name='home'),
    path('about/', education_views.about_us, name='about_us'),
    path('virtual-labs/', education_views.virtual_labs, name='virtual_labs'),
    path('virtual-labs/grade/<int:grade>/', education_views.virtual_labs, name='virtual_labs_grade'),
    path('payments/mpesa/callback/', education_views.mpesa_callback, name='mpesa_callback'),
    path('design-samples/', education_views.design_samples, name='design_samples'),
    path('accounts/', include('accounts.urls')),  # accounts/ → same homepage + other routes
    path('educations/', include('educations.urls')),  # educations/ → same homepage + other routes

]
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
