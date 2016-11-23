Summary: FIWARE Device Simulator (FDS)
Name: fiware-device-simulator
Version: %{_product_version}
Release: %{_product_release}
License: AGPLv3
BuildRoot: %{_topdir}/BUILDROOT/
BuildArch: x86_64
Requires: nodejs >= 0.10.46
Requires: logrotate
Requires(post): /sbin/chkconfig, /usr/sbin/useradd, npm
Requires(preun): /sbin/chkconfig, /sbin/service
Requires(postun): /sbin/service
Group: Applications/Engineering
Vendor: Telefonica I+D
BuildRequires: npm

%description
The FIWARE Device Simulator is a tool which makes it possible to interact with the FIWARE ecosystem of components simulating devices and other elements which may communicate with FIWARE components.
More concretely, the FIWARE Device Simulator includes the following capabilities:
    Making update context requests to Context Broker instances via NGSI v1 and NGSI v2.
    Making notification requests to subscribers of context data managed by Context Broker instances (currently only NGSI v1 notifications are supported).
    Simulating devices supporting the UltraLight 2.0 and the JSON format via HTTP and MQTT interacting with UltraLight and JSON IoT Agents.
    Automatic authorization and token management to interact with secured components and infrastructures.
    Possibility to run the simulations in real time and fast-forward modes.
    Possibility to visualize the evolution of the simulations in Freeboard.io dashboards.
For further information please visit: the official FIWARE Device Simulator documentation at ReadTheDocs.

# System folders
%define _srcdir $RPM_BUILD_ROOT/../../..
%define _service_name fiware-device-simulator
%define _install_dir /opt/fiware-device-simulator
%define _log_dir /var/log/fiware-device-simulator
%define _pid_dir /var/run/fiware-device-simulator

# RPM Building folder
%define _build_root_project %{buildroot}%{_install_dir}
# -------------------------------------------------------------------------------------------- #
# prep section, setup macro:
# -------------------------------------------------------------------------------------------- #
%prep
echo "[INFO] Preparing installation"
# Create rpm/BUILDROOT folder
rm -Rf $RPM_BUILD_ROOT && mkdir -p $RPM_BUILD_ROOT
[ -d %{_build_root_project} ] || mkdir -p %{_build_root_project}

# Copy src files
shopt -s extglob
cp -R %{_srcdir}/!(rpm) \
      %{_build_root_project}
shopt -u extglob

cp -R %{_topdir}/SOURCES/etc %{buildroot}

# Create conf dir
mkdir -p %{_build_root_project}/conf

# -------------------------------------------------------------------------------------------- #
# Build section:
# -------------------------------------------------------------------------------------------- #
%build
echo "[INFO] Building RPM"
cd %{_build_root_project}

rm -fR node_modules/
npm cache clear
npm install

# -------------------------------------------------------------------------------------------- #
# pre-install section:
# -------------------------------------------------------------------------------------------- #
%pre
echo "[INFO] Creating %{_project_user} user"
grep ^%{_project_user}: /etc/passwd
RET_VAL=$?
if [ "$RET_VAL" != "0" ]
then
  /usr/sbin/useradd -s "/bin/bash" -d %{_install_dir} %{_project_user}
  RET_VAL=$?
  if [ "$RET_VAL" != "0" ]
  then
    echo "[ERROR] Unable create %{_project_user} user"
    exit $RET_VAL
  fi
fi

# -------------------------------------------------------------------------------------------- #
# post-install section:
# -------------------------------------------------------------------------------------------- #
%post
echo "[INFO] Configuring application"

echo "[INFO] Creating the home directory"
mkdir -p _install_dir
echo "[INFO] Creating log & run directory"
mkdir -p %{_log_dir}
chown -R %{_project_user}:%{_project_user} %{_log_dir}
chmod g+s %{_log_dir}
setfacl -d -m g::rwx %{_log_dir}
setfacl -d -m o::rx %{_log_dir}

mkdir -p %{_pid_dir}
chown -R %{_project_user}:%{_project_user} %{_pid_dir}
chmod g+s %{_pid_dir}
setfacl -d -m g::rwx %{_pid_dir}
setfacl -d -m o::rx %{_pid_dir}

chown -R %{_project_user}:%{_project_user} _install_dir

# echo "[INFO] Configuring application service"
# cd /etc/init.d
# chkconfig --add %{_service_name}

echo "Done"

# -------------------------------------------------------------------------------------------- #
# pre-uninstall section:
# -------------------------------------------------------------------------------------------- #
%preun

# echo "[INFO] stoping service %{_service_name}"
# service %{_service_name} stop &> /dev/null

if [ $1 == 0 ]
then
  echo "[INFO] Removing application log files"
  # Log
  [ -d %{_log_dir} ] && rm -rfv %{_log_dir}

  echo "[INFO] Removing application run files"
  # Log
  [ -d %{_pid_dir} ] && rm -rfv %{_pid_dir}

  echo "[INFO] Removing application files"
  # Installed files
  [ -d %{_install_dir} ] && rm -rfv %{_install_dir}

  echo "[INFO] Removing application user"
  userdel -fr %{_project_user}

  # echo "[INFO] Removing application service"
  # chkconfig --del %{_service_name}
  # rm -Rf /etc/init.d/%{_service_name}

  echo "Done"
fi

# -------------------------------------------------------------------------------------------- #
# post-uninstall section:
# clean section:
# -------------------------------------------------------------------------------------------- #
%postun
%clean
rm -rf $RPM_BUILD_ROOT

# -------------------------------------------------------------------------------------------- #
# Files to add to the RPM
# -------------------------------------------------------------------------------------------- #
%files
%defattr(755,%{_project_user},%{_project_user},755)
# %config /etc/init.d/%{_service_name}
%config /etc/logrotate.d/logrotate-fiware-device-simulator-daily.conf
%{_install_dir}

%changelog

